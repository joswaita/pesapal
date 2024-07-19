import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const pesapalBaseUrl =
  process.env.NODE_ENV === "production"
    ? "https://pay.pesapal.com/v3"
    : "https://cybqa.pesapal.com/pesapalv3";

const pesapalCredentials = {
  consumer_key: process.env.PESAPAL_CONSUMER_KEY,
  consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
};

const ipnUrl = "https://a573-102-213-251-129.ngrok-free.app";

//authenticatePesapal() is a function that authenticates with Pesapal and returns the authentication result.
export const authenticatePesapal = async () => {
  try {
    const response = await axios.post(
      `${pesapalBaseUrl}/api/Auth/RequestToken`,
      pesapalCredentials,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    if (response.data.status === "200") {
      const token = response.data.token;
      console.log("Token:", token);
      return token;
    } else {
      throw new Error("Unauthorized");
    }
  } catch (error) {
    console.error("Error authenticating with Pesapal:", error.message);
    throw error;
  }
};

//allows you to be alerted in real time whenever there is a status change for any transaction.
export const registerIPN = async (req, res, next) => {
  const token = await authenticatePesapal();
  try {
    const ipnData = {
      //set url to https://www.myapplication.com/ipn
      url: `${ipnUrl}/ipn`,
      ipn_notification_type: "GET",
    };

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${pesapalBaseUrl}/api/URLSetup/RegisterIPN`,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: ipnData,
    };

    const response = await axios(config);
    const ipn_id = response.data.ipn_id;
    console.log("IPN Registration successful:", response.data);
    return { ipn_id };
  } catch (error) {
    console.error("Error registering IPN:", error.message);
    throw error;
  }
};

/**
 * gets you a list of IPNs attached to your merchant account. Helpful security feature since you
 * can easily know when somebody is attempting to intercept transactions
 */

export const registeredIPNs = async () => {
  try {
    const token = await authenticatePesapal();

    const config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `${pesapalBaseUrl}/api/URLSetup/GetIpnList`,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await axios(config);
    const ipns = response.data;
    return ipns;
  } catch (error) {
    console.error("Error fetching IPNs:", error.message);
    throw error;
  }
};
