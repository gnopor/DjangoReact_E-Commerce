import React from "react";
import { Container, Dimmer, Header, Table, Label, Button, Message, Segment, Loader, Icon } from "semantic-ui-react";
import { authAxios } from '../utils';
import { orderSummaryURL, orderItemDeleteURl, addToCartURL, orderItemUpdateQuantityURL } from '../constants';
import { Link, Redirect } from "react-router-dom";
import { connect } from "react-redux";

class OrderSummary extends React.Component {

    state = {
        data: null,
        error: null,
        loading: false
    }

    componentDidMount() {
        this.handleFetchOrder();
    }

    handleFetchOrder = () => {
        this.setState({ loading: true });
        authAxios
            .get(orderSummaryURL)
            .then(res => {
                this.setState({ data: res.data, loading: false });
            })
            .catch(err => {
                if (err.reponse.status === 404) {
                    this.setState({ error: "You currently do not have an order", loading: false });
                } else {
                    this.setState({ error: err, loading: false });
                }
            });
    };

    handleFormatData = itemVariations => {
        // convert [{id: 1}, {id: 2}] to [1,2] 
        return Object.keys(itemVariations).map(key => {
            return itemVariations[key].id
        });
    };

    handleAddToCart = (slug, itemVariations) => {
        this.setState({ loading: true });
        const variations = this.handleFormatData(itemVariations);
        authAxios
            .post(addToCartURL, { slug, variations })
            .then(res => {
                this.handleFetchOrder();
                this.setState({ loading: false });
            })
            .catch(err => {
                this.setState({ error: err, loading: false });
            });
    };


    handleRemoveQuantityFromCart = (slug) => {
        authAxios
            .post(orderItemUpdateQuantityURL, { slug })
            .then(res => {
                this.handleFetchOrder();
            })
            .catch(err => {
                this.setState({ error: err });
            });
    };

    renderVariation = orderItem => {
        let text = "";
        orderItem.item_variations.forEach(iv => {
            text += `${iv.variation.name}: ${iv.value}, `
        });
        return text;
    }


    handleRemoveItem = (itemID) => {
        authAxios
            .delete(orderItemDeleteURl(itemID))
            .then(res => {
                this.handleFetchOrder();
            })
            .catch(err => {
                this.setState({ error: err });
            });
    };

    render() {
        const { data, error, loading } = this.state;

        const { isAuthenticated } = this.props;
        if (!isAuthenticated) {
            return <Redirect to="/login" />
        }

        return (
            <Container>
                <Header>Order Summary</Header>
                {error && (
                    <Message
                        error
                        header="There was an error"
                        content={JSON.stringify(error)}
                    />
                )}
                {loading && (
                    <Segment>
                        <Dimmer>
                            <Loader inverted>Loading</Loader>
                        </Dimmer>
                    </Segment>
                )}
                {data && (
                    <Table celled>
                        <Table.Header>
                            <Table.Row>
                                <Table.HeaderCell>Item #</Table.HeaderCell>
                                <Table.HeaderCell>Item name</Table.HeaderCell>
                                <Table.HeaderCell>Item price</Table.HeaderCell>
                                <Table.HeaderCell>Item quantity</Table.HeaderCell>
                                <Table.HeaderCell>Total item price</Table.HeaderCell>
                            </Table.Row>
                        </Table.Header>

                        <Table.Body>
                            {data.order_items.map((order_item, i) => {
                                return (
                                    <Table.Row key={order_item.id}>
                                        <Table.Cell>{i}</Table.Cell>
                                        <Table.Cell>{order_item.item.title} - {this.renderVariation(order_item)} </Table.Cell>
                                        <Table.Cell>${order_item.item.price}</Table.Cell>
                                        <Table.Cell textAlign="center">
                                            <Icon
                                                name="minus"
                                                style={{ float: "left", cursor: "pointer" }}
                                                onClick={() => this.handleRemoveQuantityFromCart(order_item.item.slug)}
                                            />
                                            {order_item.quantity}
                                            <Icon
                                                name="plus"
                                                style={{ float: "right", cursor: "pointer" }}
                                                onClick={() =>
                                                    this.handleAddToCart(
                                                        order_item.item.slug,
                                                        order_item.item_variations
                                                    )}
                                            />
                                        </Table.Cell>
                                        <Table.Cell>
                                            {order_item.item.discount_price && (
                                                <Label ribbon color="green">ON DISCOUNT</Label>
                                            )}
                                            ${order_item.final_price}
                                            <Icon
                                                name="trash"
                                                color="red"
                                                style={{ float: "right", cursor: "pointer" }}
                                                onClick={() => this.handleRemoveItem(order_item.id)}
                                            />
                                        </Table.Cell>
                                    </Table.Row>
                                );
                            })}

                            <Table.Row>
                                <Table.Cell />
                                <Table.Cell />
                                <Table.Cell />
                                <Table.Cell colSpan="2" textAlign="center">
                                    Total: ${data.total}
                                </Table.Cell>
                            </Table.Row>

                        </Table.Body>


                        <Table.Footer>
                            <Table.Row>
                                <Table.HeaderCell colSpan="5" textAlign="right">
                                    <Link to="/checkout">
                                        <Button color="yellow">Checkout</Button>
                                    </Link>
                                </Table.HeaderCell>
                            </Table.Row>
                        </Table.Footer>

                    </Table>
                )}
            </Container>
        )
    }
}

const mapStateToProps = state => {
    return {
        isAuthenticated: state.auth.token !== null
    };
};

export default connect(mapStateToProps)(OrderSummary);