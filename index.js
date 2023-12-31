const express = require("express");
const Stripe = require("stripe");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const nodemailer = require("nodemailer");

// ********* Handling Uncaught Exception **********
process.on("uncaughtException", (error) => {
  console.log(`Error ${error.message}`);
  console.log("Shutting down the server for handling uncaught exceptions");

  process.exit(1);
});

// ********* Config **********
if (process.env.NODE_ENV !== "PRODUCTION") {
  dotenv.config({
    path: "config/.env",
  });
}

const app = express();

// Middleware to parse JSON
app.use(bodyParser.json());
app.use(
  cors({
    origin: "*",
  })
);

app.get("/api/v2", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Working",
  });
});

app.post("/payment/process", async (req, res) => {
  const stripeClient = new Stripe(`${process.env.STRIPE_SEC_KEY}`);

  try {
    const { token, amount, receipt_email } = req.body;

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount,
      currency: "aud",
      confirm: true,
      payment_method_data: {
        type: "card",
        card: {
          token: token,
        },
      },
      receipt_email,
      return_url: `${process.env.DOMAIN}/booking/payment`,
    });

    res.status(200).json({
      success: true,
      client_secret: paymentIntent.client_secret,
      message: "Payment successful",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Payment failed!, Something went wrong || ${error.message}`,
    });
  }
});

app.post("/payment/refund", async (req, res) => {
  const stripeClient = new Stripe(`${process.env.STRIPE_SEC_KEY}`);

  try {
    const { paymentIntentId } = req.body;

    const refund = await stripeClient.refunds.create({
      payment_intent: paymentIntentId,
    });

    res.status(200).json({
      success: true,
      message: "Payment refund successfull",
      refund,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/send/mail", async (req, res) => {
  const { email, subject, message } = req.body;

  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMPT_HOST,
      port: process.env.SMPT_PORT,
      service: process.env.SMPT_SERVICE,
      auth: {
        user: process.env.SMPT_USER,
        pass: process.env.SMPT_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.SMPT_USER,
      to: email,
      subject: subject,
      html: message,
    };

    await transport.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Message has been send to the customer successfully.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

const PORT = process.env.PORT || 8000;

// Create Server
const server = app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// ********* Uhandled Promise Rejection **********
process.on("unhandledRejection", (error) => {
  console.log(`Error ${error.message}`);
  console.log(
    "Shutting down the server for handling uncaught promise rejection"
  );

  server.close(() => {
    process.exit(1);
  });
});
