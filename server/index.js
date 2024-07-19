import express from "express";
import axios from "axios";
import { config as dotenvConfig } from "dotenv";
import { authenticatePesapal, registerIPN, registeredIPNs } from "./utils.js";
import { pesapalAuthTokenMiddleware } from "./middleware.js";

dotenvConfig();

const PORT = process.env.PORT || 3000;
const app = express();
express.json();
app.use(express.json());

app.use("/get-ipns", pesapalAuthTokenMiddleware);
app.use("/get-transaction-status", pesapalAuthTokenMiddleware);
app.use("/callback", express.json());

//url to get IPNs associated with your accounts=>security feature
app.get("/get-ipns", async (req, res) => {
  try {
    const ipns = await registeredIPNs(req.pesapalToken);
    console.log("IPNs:", ipns);
    res.json(ipns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//callback url to handle response after an order is submitted  to pesapal
app.get("/callback", (req, res) => {
  const orderSubmissionResult = req.query;

  if (!orderSubmissionResult) {
    console.error(
      "Invalid or missing order submission result data:",
      orderSubmissionResult
    );
    return res
      .status(400)
      .send(
        "Invalid order submission result data. Please check the callback payload."
      );
  }

  // Process the order submission result based on its status
  if (orderSubmissionResult) {
    // order submission was successful, handle accordingly
    console.log(
      "Order Placement successful. Order ID:",
      orderSubmissionResult.OrderTrackingId
    );
    res.send("Order placement was successful!");
  } else {
    // Payment failed or other status, handle accordingly
    console.error(
      "order Placement failed. Order ID:",
      orderSubmissionResult.OrderTrackingId
    );
    res.send(
      "Order placement failed or other status",
      orderSubmissionResult.OrderTrackingId
    );
  }
});

//submit order-this is actual payment integration that happens when you press pay now
app.post("/submit-order", async (req, res, next) => {
  try {
    const token = await authenticatePesapal();
    const { ipn_id } = await registerIPN(req, res, next);
    console.log("ipn_id", ipn_id);

    var data = JSON.stringify({
      id: "12aghtthhhs12s",
      currency: "KES",
      amount: 1,
      description: "description goes here",
      callback_url: "https://a9a1-102-213-251-136.ngrok-free.app/callback",
      notification_id: ipn_id,
      billing_address: {
        email_address: "john.doe@example.com",
        phone_number: "Juja",
        country_code: "",
        first_name: "John",
        middle_name: "",
        last_name: "Doe",
        line_1: "",
        line_2: "",
        city: "",
        state: "",
        postal_code: null,
        zip_code: null,
      },
    });

    var config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://cybqa.pesapal.com/pesapalv3/api/Transactions/SubmitOrderRequest",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: data,
    };

    const response = await axios(config);
    const { redirect_url, status, error } = response.data;

    // Check if the status is 200 before sending a response
    if (status === "200") {
      console.log(redirect_url);
      return res.send(redirect_url); // Send redirect only on success
    } else {
      console.error(error || `API request failed with status: ${status}`);
      throw new Error("API request failed"); // Throw an error for non-200 status
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" }); // Handle errors in authenticatePesapal or registerIPN
  }
});

//get transaction status
app.get("/get-transaction-status", async (req, res) => {
  const orderTrackingId = "c06c173a-283e-4ee0-b6f8-dd859c2195ab";
  try {
    const token = await authenticatePesapal();
    const config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://cybqa.pesapal.com/pesapalv3/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios(config);
    return res.send(response.data);
    console.log(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
