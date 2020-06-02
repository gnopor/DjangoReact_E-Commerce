const localhost = 'http://127.0.0.1:8000';

const apiURL = "/api";

export const endPoint = `${localhost}${apiURL}`;

export const productListURL = `${endPoint}/products/`;
export const productDetailURL = id => `${endPoint}/products/${id}/`;
export const addToCartURL = `${endPoint}/add-to-cart/`;
export const orderSummaryURL = `${endPoint}/order-summary/`;
export const checkoutURL = `${endPoint}/checkout/`;
export const addCouponURL = `${endPoint}/add-coupon/`;
export const addressListURL = addressType =>
    `${endPoint}/addresses/?address_type=${addressType}`;
export const addressCreateURL = `${endPoint}/addresses/create/`;
export const addressUpdateURL = id => `${endPoint}/addresses/${id}/update/`;
export const addressDeleteURL = id => `${endPoint}/addresses/${id}/delete/`;
export const orderItemDeleteURl = id => `${endPoint}/order-items/${id}/delete/`;
export const countryListURL = `${endPoint}/countries/`;
export const userIDURL = `${endPoint}/user-id/`;
export const paymentListURL = `${endPoint}/payments/`;
export const orderItemUpdateQuantityURL = `${endPoint}/order-item/update-quantity/`;

