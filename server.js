const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const OCTO_SHOP_ID = process.env.OCTO_SHOP_ID;
const OCTO_SECRET = process.env.OCTO_SECRET;

app.post("/create-payment", async (req, res) => {
  const { amount, orderId } = req.body;
  const init_time = new Date().toISOString().slice(0, 19).replace("T", " ");

  const body = {
    octo_shop_id: OCTO_SHOP_ID,
    octo_secret: OCTO_SECRET,
    shop_transaction_id: orderId,
    auto_capture: true,
    init_time,
    total_sum: amount,
    currency: "UZS",
    description: "Оплата через Octo",
    return_url: "https://example.com/success",
    notify_url: "https://example.com/notify",
    test: true,
  };

  try {
    const response = await fetch("https://secure.octo.uz/prepare_payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Пытаемся достать URL оплаты из всех возможных полей
    const payUrl =
      data.payment_url ||
      data.octo_pay_url ||
      (data.data && data.data.octo_pay_url);

    if (payUrl) {
      // Отдаем фронтенду единый ключ payment_url
      return res.json({ payment_url: payUrl });
    }

    // Если Octo вернул ошибку
    if (data.error && data.error !== 0) {
      return res
        .status(400)
        .json({ error: data.errMessage || data.errorMessage || "Ошибка Octo" });
    }

    // Неожиданный формат ответа
    return res
      .status(400)
      .json({ error: "Octo вернул неожиданный ответ", raw: data });
  } catch (err) {
    return res.status(500).json({ error: "Ошибка сервера", details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
