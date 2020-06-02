import React from 'react'
import { Button, Container, Dimmer, Icon, Image, Item, Header, Label, Loader, Message, Segment, Card, Grid, Form, Divider, Select } from 'semantic-ui-react'
import axios from 'axios';

import { addToCartURL, productDetailURL } from '../constants';
import { authAxios } from '../utils';
import { fetchCart } from '../store/actions/cart';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';


class ProductDetail extends React.Component {

    state = {
        loading: false,
        error: null,
        data: [],
        formVisible: false,
        formData: {}
    };

    componentDidMount() {
        this.handleFetchItem();
    }

    handleToggleForm = () => {
        const { formVisible } = this.state;
        this.setState({
            formVisible: !formVisible
        });
    };

    handleFetchItem = () => {
        const {
            match: { params }
        } = this.props;
        this.setState({ loading: true });
        axios
            .get(productDetailURL(params.productID))
            .then(res => {
                this.setState({ data: res.data, loading: false });
            })
            .catch(err => {
                this.setState({ error: err, loading: false });
            });
    }

    handleFormData = formData => {
        return Object.keys(formData).map(key => {
            return formData[key];
        });
    };

    handleAddToCart = slug => {
        this.setState({ loading: true });
        const { formData } = this.state;
        const variations = this.handleFormData(formData);
        console.log(variations);
        authAxios
            .post(addToCartURL, { slug, variations })
            .then(res => {
                this.props.fetchCart();
                this.setState({ loading: false });
            })
            .catch(err => {
                this.setState({ error: err, loading: false });
            });
    }

    handleChange = (e, { name, value }) => {
        const { formData } = this.state;
        const updatedFormData = {
            ...formData,
            [name]: value
        };
        this.setState({ formData: updatedFormData });
    };

    render() {
        const { data, error, formData, formVisible, loading } = this.state;
        const item = data;
        return (
            <Container>

                {error && (
                    <Message
                        error
                        header='There was some errors with your submission'
                        content={JSON.stringify(error)}
                    />
                )}
                {
                    loading && (
                        <Segment>
                            <Dimmer active inverted>
                                <Loader inverted content='Loading' />
                            </Dimmer>

                            <Image src='https://react.semantic-ui.com/images/wireframe/short-paragraph.png' />
                        </Segment>
                    )
                }
                <Grid columns={2} divided>
                    <Grid.Row>
                        <Grid.Column>
                            <Card
                                fluid
                                image={item.image}
                                header={item.title}
                                meta={
                                    <React.Fragment>
                                        {item.category}
                                        {item.discount_price && (
                                            <Label color={
                                                item.label === "primary" ? "blue" :
                                                    item.label === "secondary" ? "green" :
                                                        "olive"
                                            }>
                                                {item.label}
                                            </Label>
                                        )}
                                    </React.Fragment>
                                }
                                description={item.description}
                                extra={
                                    <React.Fragment>
                                        <Button fluid color="yellow" icon labelPosition="right" onClick={this.handleToggleForm}>
                                            Add to Cart
                                    <Icon name='cart plus' />
                                        </Button>
                                    </React.Fragment>
                                }
                            />
                            {formVisible && (
                                <React.Fragment>
                                    <Divider />
                                    <Form>
                                        {data.variations.map(v => {
                                            const name = v.name.toLowerCase();
                                            return (
                                                <Form.Field key={v.id}>
                                                    <Select
                                                        name={name}
                                                        onChange={this.handleChange}
                                                        options={v.item_variations.map(item => {
                                                            return {
                                                                key: item.id,
                                                                text: item.value,
                                                                value: item.id
                                                            };
                                                        })}
                                                        placeholder={`Choose ${name}`}
                                                        selection
                                                        value={formData[name]}
                                                    />
                                                </Form.Field>
                                            );
                                        })}
                                        <Form.Button primary onClick={() => this.handleAddToCart(item.slug)}>
                                            Submit
                                        </Form.Button>
                                    </Form>
                                </React.Fragment>
                            )}
                        </Grid.Column>

                        <Grid.Column>
                            <Header as="h2">Try different variations</Header>

                            {data.variations &&
                                data.variations.map(v => { //v stand for variations
                                    return (
                                        <React.Fragment key={v.id}>

                                            <Header as="h3">{v.name}</Header>

                                            <Item.Group divided >
                                                {v.item_variations.map(iv => { // iv stand for item variations
                                                    return (
                                                        <Item key={iv.id}>
                                                            {iv.attachment &&
                                                                <Item.Image
                                                                    size="tiny"
                                                                    src={`http://127.0.0.1:8000${iv.attachment}`}
                                                                />
                                                            }
                                                            <Item.Content verticalAlign="middle">
                                                                {iv.value}
                                                            </Item.Content>
                                                        </Item>
                                                    );
                                                })}
                                            </Item.Group>

                                        </React.Fragment>

                                    );
                                })
                            }
                        </Grid.Column>
                    </Grid.Row>
                </Grid>


            </Container>

        );

    }
}

const mapDispatchToProps = dispatch => {
    return {
        fetchCart: () => dispatch(fetchCart())
    };
};


export default withRouter(connect(null, mapDispatchToProps)(ProductDetail));




