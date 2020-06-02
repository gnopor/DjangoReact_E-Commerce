import React from 'react';
import { Grid, Header, Dimmer, Loader, Message, Segment, Image, Divider, Menu, Form, Select, Card, Label, Button, Table } from 'semantic-ui-react';
import { authAxios } from '../utils';
import { Redirect } from 'react-router-dom';

import {
    addressListURL,
    countryListURL,
    addressCreateURL,
    userIDURL,
    addressUpdateURL,
    addressDeleteURL,
    paymentListURL
} from '../constants';
import { connect } from 'react-redux';

const UPDATE_FORM = "UPDATE_FORM";
const CREATE_FORM = "CREATE_FORM";



class PaymentHistory extends React.Component {

    state = {
        payments: []
    };

    componentDidMount() {
        this.handleFetchPayments();
    }

    handleFetchPayments = () => {
        this.setState({ loading: true })
        authAxios
            .get(paymentListURL)
            .then(res => {
                this.setState({ payments: res.data, loading: false });
            })
            .catch(err => {
                this.setState({ error: err, loading: false });
            });
    };

    render() {
        const { payments } = this.state;
        return (
            <Table celled>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>ID</Table.HeaderCell>
                        <Table.HeaderCell>Amount</Table.HeaderCell>
                        <Table.HeaderCell>Date</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {payments.map(p => {
                        return (
                            <Table.Row key={p.id}>
                                <Table.Cell>{p.id}</Table.Cell>
                                <Table.Cell>{p.amount}</Table.Cell>
                                <Table.Cell>{new Date(p.timestamp).toUTCString()}</Table.Cell>
                            </Table.Row>
                        );
                    })}
                </Table.Body>

            </Table>
        );
    }
}


class AddressForm extends React.Component {
    state = {
        error: null,
        loading: false,
        formData: {
            "address_type": "",
            "apartment_address": "",
            "country": "",
            "default": true,
            "id": "",
            "street_address": "",
            "user": 1,
            "zip": ""
        },
        saving: false,
        success: false
    };

    componentDidMount() {
        const { address, formType } = this.props;
        if (formType === UPDATE_FORM) {
            this.setState({ formData: address });
        }
    }

    handleChange = e => {
        const { formData } = this.state;
        const updateFormData = {
            ...formData,
            [e.target.name]: e.target.value
        };
        this.setState({
            formData: updateFormData
        });
    };


    handleSelectChange = (e, { name, value }) => {
        const { formData } = this.state;
        const updateFormData = {
            ...formData,
            [name]: value
        };
        this.setState({
            formData: updateFormData
        });
    };


    handleToggleDefault = () => {
        const { formData } = this.state;
        const updateFormData = {
            ...formData,
            default: !formData.default
        };
        this.setState({
            formData: updateFormData
        });
    };


    handleSubmit = e => {
        this.setState({ saving: true });
        e.preventDefault();
        const { formType } = this.props;
        if (formType === UPDATE_FORM) {
            this.handleUpdateAddress();
        } else {
            this.handleCreateAddress();
        }
    };

    handleCreateAddress = () => {
        const { userID, activeItem } = this.props;
        const { formData } = this.state;
        authAxios
            .post(addressCreateURL, {
                ...formData,
                user: userID,
                address_type: activeItem === "billingAddress" ? "B" : "S"
            })
            .then(res => {
                this.setState({
                    saving: true,
                    success: true,
                    formData: { default: false }
                });
                this.props.callback();

            })
            .catch(err => {
                this.setState({ error: err });
            });

    };

    handleUpdateAddress = () => {
        const { userID, activeItem } = this.props;
        const { formData } = this.state;
        authAxios
            .put(addressUpdateURL(formData.id), {
                ...formData,
                user: userID,
                address_type: activeItem === "billingAddress" ? "B" : "S"
            })
            .then(res => {
                this.setState({ saving: true, success: true });
                this.props.callback();
            })
            .catch(err => {
                this.setState({ error: err });
            });
    };


    render() {
        const { error, formData, success, saving } = this.state;
        const { countries } = this.props;

        return (
            <Form onSubmit={this.handleSubmit} success={success} error={error}>
                <Form.Input
                    required
                    name="street_address"
                    placeholder="Street address"
                    onChange={this.handleChange}
                    value={formData.street_address}
                />
                <Form.Input
                    required
                    name="apartment_address"
                    placeholder="Apartment address"
                    onChange={this.handleChange}
                    value={formData.apartment_address}

                />
                <Form.Field required>
                    <Select
                        loading={countries.length < 1}
                        clearable
                        search
                        options={countries}
                        fluid
                        name="country"
                        placeholder="Country"
                        onChange={this.handleSelectChange}
                        value={formData.country}

                    />
                </Form.Field>
                <Form.Input
                    required
                    name="zip"
                    placeholder="Zip code"
                    onChange={this.handleChange}
                    value={formData.zip}
                />
                <Message
                    success
                    header="Success!"
                    content="Your address was saved"
                />
                {error && (
                    <Message
                        error
                        header='There was an error'
                        content={JSON.stringify(error)}
                    />
                )}
                <Form.Checkbox
                    name="default"
                    label="Make this the default address"
                    onChange={this.handleToggleDefault}
                    checked={formData.default}
                />
                <Form.Button primary disabled={saving} loading={saving}>Save</Form.Button>

            </Form>
        );
    }
}




class Profile extends React.Component {
    state = {
        activeItem: "billingAddress",
        addresses: [],
        countries: [],
        userID: null,
        selectedAddress: null,
        error: null,
        loading: false
    };

    componentDidMount() {
        this.handleFetchAddresses();
        this.handleFetchCountries();
        this.handleFetchUserID();
    }

    handleItemClick = (name) => {
        // we use a callback on the setState here because we want the activeItem to be set before 
        // the execution of handleFetchAddress().
        // withou that, this.handleFetchAddress() is call before this.setState(). there are in different thread
        this.setState({ activeItem: name }, () => {
            this.handleFetchAddresses();
        });

    }

    handleGetActiveItem = () => {
        const { activeItem } = this.state;
        if (activeItem === "billingAddress") {
            return "Billign Address";
        } else if (activeItem === "shippingAddress") {
            return "Shipping Address";
        }

        return "Payment History";
    };

    handleFormatCountries = countries => {
        const keys = Object.keys(countries);
        return keys.map(k => {
            return {
                key: k,
                text: countries[k],
                value: k
            };
        });
    };

    handleSelectedAddress = address => {
        this.setState({ selectedAddress: address })
    }


    handleFetchCountries = () => {
        authAxios
            .get(countryListURL)
            .then(res => {
                this.setState({ countries: this.handleFormatCountries(res.data) });
            })
            .catch(err => {
                this.setState({ error: err });
            });
    };

    handleFetchUserID = () => {
        authAxios
            .get(userIDURL)
            .then(res => {
                this.setState({ userID: res.data.userID });
            })
            .catch(err => {
                this.setState({ error: err });
            });
    };

    handleDeleteAddress = (addressID) => {
        authAxios
            .delete(addressDeleteURL(addressID))
            .then(res => {
                this.handleCallback();
            })
            .catch(err => {
                this.setState({ error: err });
            });
    };


    handleFetchAddresses = () => {
        this.setState({ loading: true });
        const { activeItem } = this.state;
        authAxios
            .get(
                addressListURL(activeItem === "billingAddress" ? "B" : "S")
            )
            .then(res => {
                this.setState({ addresses: res.data, loading: false });
            })
            .catch(err => {
                this.setState({ error: err });
            });
    };


    handleCallback = () => {
        this.handleFetchAddresses();
        this.setState({ selectedAddress: null });
    };


    renderAddresses = () => {
        const { activeItem, addresses, countries, selectedAddress, userID } = this.state;

        return (
            <React.Fragment>
                <Card.Group>
                    {addresses.map(a => {
                        return (
                            <Card key={a.id}>
                                <Card.Content>
                                    {a.default && (
                                        <Label as="a" color="blue" ribbon="right">
                                            Default
                                        </Label>
                                    )}
                                    <Card.Header>
                                        {a.street_address}, {a.apartment_address}
                                    </Card.Header>
                                    <Card.Meta>{a.country}</Card.Meta>
                                    <Card.Description>{a.zip}</Card.Description>
                                </Card.Content>

                                <Card.Content extra>
                                    <Button
                                        color="yellow"
                                        onClick={() => this.handleSelectedAddress(a)}
                                    >
                                        Update
                                            </Button>
                                    <Button
                                        color="red"
                                        onClick={() => this.handleDeleteAddress(a.id)}
                                    >
                                        Delete
                                            </Button>
                                </Card.Content>

                            </Card>
                        );
                    })}
                </Card.Group>
                {addresses.length > 0 ? <Divider /> : null}
                {selectedAddress === null ? (
                    <AddressForm
                        activeItem={activeItem}
                        countries={countries}
                        formType={CREATE_FORM}
                        userID={userID}
                        callback={this.handleCallback}
                    />
                ) : null}
                {selectedAddress && (
                    <AddressForm
                        activeItem={activeItem}
                        countries={countries}
                        address={selectedAddress}
                        formType={UPDATE_FORM}
                        userID={userID}
                        callback={this.handleCallback}
                    />

                )}

            </React.Fragment>
        )
    }

    render() {
        const { activeItem, error, loading } = this.state;

        const { isAuthenticated } = this.props;
        if (!isAuthenticated) {
            return <Redirect to="/login" />
        }

        return (
            <Grid container columns={2} divided>
                <Grid.Row columns={1}>
                    <Grid.Column>
                        {error && (
                            <Message
                                error
                                header='There was an error'
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
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Column width={6}>

                        <Menu pointing vertical fluid>
                            <Menu.Item
                                name="Billing Address"
                                active={activeItem === "billingAddress"}
                                onClick={() => this.handleItemClick("billingAddress")}
                            />
                            <Menu.Item
                                name="Shipping Address"
                                active={activeItem === "shippingAddress"}
                                onClick={() => this.handleItemClick("shippingAddress")}
                            />
                            <Menu.Item
                                name="Payment history"
                                active={activeItem === "paymentHistory"}
                                onClick={() => this.handleItemClick("paymentHistory")}
                            />
                        </Menu>

                    </Grid.Column>
                    <Grid.Column width={10}>
                        <Header>
                            {this.handleGetActiveItem}
                        </Header>
                        <Divider />

                        {activeItem === "paymentHistory" ? (
                            <PaymentHistory />
                        ) : (
                                this.renderAddresses()
                            )}

                    </Grid.Column>
                </Grid.Row>
            </Grid>
        );
    }
}

const mapStateToProps = state => {
    return {
        isAuthenticated: state.auth.token !== null
    };
};

export default connect(mapStateToProps)(Profile);