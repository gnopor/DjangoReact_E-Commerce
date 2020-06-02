import React, { Component } from 'react';
import {
    CardElement,
    injectStripe,
    Elements,
    StripeProvider
} from 'react-stripe-elements';
import {
    Button,
    Container,
    Dimmer,
    Divider,
    Form,
    Image,
    Item,
    Header,
    Message,
    Loader,
    Label,
    Segment,
    Select

} from 'semantic-ui-react';
import { authAxios } from '../utils';
import { checkoutURL, orderSummaryURL, addCouponURL, addressListURL } from '../constants';
import { withRouter, Link } from 'react-router-dom';



const OrderPreview = (props) => {
    const { data } = props;

    return (
        <React.Fragment>
            {data && (
                <React.Fragment>
                    <Item.Group relaxed>
                        {data.order_items.map((order_item, i) => {
                            //console.log(order_item);
                            return (
                                <Item key={i}>
                                    <Item.Image
                                        size="tiny"
                                        src={`http://127.0.0.1:8000${order_item.item.image}`}
                                    />
                                    <Item.Content verticalAlign="middle">
                                        <Item.Header as="a">
                                            {order_item.quantity} x {order_item.item.title}
                                        </Item.Header>
                                        <Item.Extra>
                                            <Label>${order_item.final_price}</Label>
                                        </Item.Extra>
                                    </Item.Content>
                                </Item>
                            );
                        })}
                    </Item.Group>

                    <Item.Group>
                        <Item>
                            <Item.Content>
                                <Item.Header>
                                    Order Total: ${data.total}
                                    {data.coupon && (
                                        <Label color="green" style={{ marginLeft: "10px" }}>
                                            Current coupon:  {data.coupon.code} for ${data.coupon.amount}
                                        </Label>
                                    )}
                                </Item.Header>
                            </Item.Content>
                        </Item>
                    </Item.Group>
                </React.Fragment>
            )}
        </React.Fragment>
    );
};



class CouponForm extends Component {

    state = {
        code: ""
    };

    handleChange = e => {
        this.setState({
            code: e.target.value
        });
    };

    handleSumit = (e) => {
        const { code } = this.state;
        this.props.handleAddCoupon(e, code);
        this.setState({ code: "" });
    };

    render() {
        const { code } = this.state;
        return (
            <React.Fragment>
                <Form onSubmit={this.handleSumit}>
                    <Form.Field>
                        <label>Coupon code</label>
                        <input placeholder="Enter a coupon..." value={code} onChange={this.handleChange} />
                    </Form.Field>
                    <Button type="submit">Submit</Button>
                </Form>
            </React.Fragment>
        );
    }
}



class CheckoutForm extends Component {

    state = {
        data: null,
        loading: false,
        error: null,
        success: false,
        billingAddresses: [],
        shippingAddresses: [],
        selectedBillingAddress: "",
        selectedShippingAddress: ""
    };


    componentDidMount() {
        this.handleFetchOrder();
        this.handleFetchBillingAddresses();
        this.handleFetchShippingAddresses();
    }

    handleGetDefaultAddresse = addresses => {
        const filteredAddresses = addresses.filter(address => address.default === true);
        if (filteredAddresses.length > 0) {
            return filteredAddresses[0].id;
        }
        return "";
    }

    handleFetchBillingAddresses = () => {
        this.setState({ loading: true });
        authAxios
            .get(addressListURL("B"))
            .then(res => {
                this.setState({
                    billingAddresses: res.data.map(a => {
                        return {
                            key: a.id,
                            text: `${a.street_address}, ${a.apartment_address}, ${a.country}`,
                            value: a.id
                        }
                    }),
                    selectedBillingAddress: this.handleGetDefaultAddresse(res.data),
                    loading: false
                });
            })
            .catch(err => {
                this.setState({ error: err, loading: false });
            });
    };

    handleFetchShippingAddresses = () => {
        this.setState({ loading: true });
        authAxios
            .get(addressListURL("S"))
            .then(res => {
                this.setState({
                    shippingAddresses: res.data.map(a => {
                        return {
                            key: a.id,
                            text: `${a.street_address}, ${a.apartment_address}, ${a.country}`,
                            value: a.id
                        }
                    }),
                    selectedShippingAddress: this.handleGetDefaultAddresse(res.data),

                    loading: false
                });
            })
            .catch(err => {
                this.setState({ error: err, loading: false });
            });
    };


    handleFetchOrder = () => {
        this.setState({ loading: true });
        authAxios
            .get(orderSummaryURL)
            .then(res => {
                this.setState({ data: res.data, loading: false });
            })
            .catch(err => {
                if (err.reponse.status === 404) {
                    this.props.history.push("/products");
                } else {
                    this.setState({ error: err, loading: false });
                }
            });
    };


    handleAddCoupon = (e, code) => {
        e.preventDefault();
        this.setState({ loading: true });
        authAxios
            .post(addCouponURL, { code })
            .then(res => {
                this.setState({ loading: false });
                this.handleFetchOrder();
            })
            .catch(err => {

                this.setState({ error: err, loading: false });

            });
    };

    handleSelectChange = (e, { name, value }) => {
        this.setState({ [name]: value });
    };

    submit = (ev) => {
        ev.preventDefault();
        this.setState({ loading: true });
        if (this.props.stripe) {
            this.props.stripe.createToken()
                .then(result => {
                    if (result.error) {
                        this.setState({ error: result.error.message, loading: false });
                    } else {
                        this.setState({ error: null });
                        const {
                            selectedBillingAddress,
                            selectedShippingAddress
                        } = this.state;

                        authAxios
                            .post(checkoutURL, {
                                stripeToken: result.token.id,
                                selectedBillingAddress,
                                selectedShippingAddress
                            })
                            .then(res => {
                                this.setState({ loading: false, success: true });
                            })
                            .catch(err => {
                                console.log({
                                    stripeToken: result.token.id,
                                    selectedBillingAddress,
                                    selectedShippingAddress
                                });
                                this.setState({ loading: false, error: err });
                            });
                    }
                });
        } else {
            console.log("Stripe is not loaded");
        }

    };

    render() {
        const { data,
            error,
            loading,
            success,
            billingAddresses,
            shippingAddresses,
            selectedBillingAddress,
            selectedShippingAddress
        } = this.state;
        return (
            <div>
                {error && (
                    <Message
                        error
                        header='There was some errors with your submission'
                        content={JSON.stringify(error)}
                    />
                )}
                {loading && (
                    <Segment>
                        <Dimmer active inverted>
                            <Loader inverted>Loading</Loader>
                        </Dimmer>

                        <Image src='https://react.semantic-ui.com/images/wireframe/short-paragraph.png' />
                    </Segment>
                )}

                <OrderPreview data={data} />


                <Divider />
                <CouponForm handleAddCoupon={(e, code) => this.handleAddCoupon(e, code)} />
                <Divider />

                <Header>Select a billing addresse</Header>
                {billingAddresses.length > 0 ? (
                    <Select
                        name="selectedBillingAddress"
                        value={selectedBillingAddress}
                        clearable options={billingAddresses}
                        selection
                        onChange={this.handleSelectChange} />
                ) : (
                        <p>You need to <Link to="/profile">add a billing addresse</Link></p>
                    )}


                <Header>Select a shipping addresse</Header>
                {shippingAddresses.length > 0 ? (
                    <Select
                        name="selectedShippingAddress"
                        value={selectedShippingAddress}
                        clearable options={shippingAddresses}
                        selection
                        onChange={this.handleSelectChange} />
                ) : (
                        <p>You need to <Link to="/profile">add a shipping addresse</Link></p>
                    )}
                <Divider />


                {billingAddresses.length < 1 || shippingAddresses.length < 1 ? (
                    <p>You need to add addresses before you can complete your puchase</p>
                ) : (
                        <React.Fragment>

                            <Header>Would you like to complete your puchase?</Header>
                            <CardElement />
                            {success && (
                                <Message positive>
                                    <Message.Header>Your payment was successful</Message.Header>
                                    <p>
                                        Go to your <b>profile</b> to see the order delivery status.
                        </p>
                                </Message>
                            )}
                            <Button
                                onClick={this.submit}
                                primary
                                style={{ marginTop: "10px" }}
                                loading={loading}
                                disabled={loading}
                            >
                                Submit
                            </Button>
                        </React.Fragment>
                    )}

            </div>
        );
    }
}


const InjectedForm = withRouter(injectStripe(CheckoutForm));


const WrappedForm = () => (
    <Container text>
        <StripeProvider apiKey="pk_test_ffJsfC2lo7brg48q4ijmDjK000UJ9rB62K">
            <div>
                <h1>Complete your order</h1>
                <Elements>
                    <InjectedForm />
                </Elements>

            </div>

        </StripeProvider>
    </Container>
);

export default WrappedForm;