import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
const API_BASE = process.env.REACT_APP_API_URL || "";

function getPriceInfo(course) {
  const rawPrice =
    course?.price ??
    course?.fees ??
    course?.amount ??
    course?.cost ??
    null;

  if (rawPrice === 0 || rawPrice === "0" || rawPrice === "" || rawPrice == null) {
    return { label: "Free", isFree: true, value: 0 };
  }

  const numericPrice =
    typeof rawPrice === "number" ? rawPrice : Number(rawPrice);
  if (Number.isFinite(numericPrice)) {
    return {
      label: `\u20B9${numericPrice}`,
      isFree: false,
      value: numericPrice
    };
  }

  return { label: String(rawPrice), isFree: false, value: rawPrice };
}

function loadScript(src) {
  return new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Payment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [mockMode, setMockMode] = useState(false);
  const [method, setMethod] = useState("card");

  useEffect(() => {
    async function setupScript() {
      const ready = await loadScript(RAZORPAY_SCRIPT);
      setScriptReady(ready);
    }

    setupScript();
  }, []);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const ref = doc(db, "courses", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setError("Course not found.");
          return;
        }
        setCourse({ id: snap.id, ...snap.data() });
      } catch (err) {
        setError(err.message || "Unable to load course.");
      } finally {
        setLoading(false);
      }
    }

    fetchCourse();
  }, [id]);

  const priceInfo = useMemo(() => getPriceInfo(course), [course]);

  const finalizePurchase = async ({ paymentId, provider = "razorpay" } = {}) => {
    const user = auth.currentUser;
    if (!user) {
      navigate("/login");
      return;
    }

    const purchaseId = `${user.uid}_${course.id}`;
    await setDoc(doc(db, "purchases", purchaseId), {
      userId: user.uid,
      courseId: course.id,
      price: priceInfo.value,
      status: priceInfo.isFree ? "free" : "paid",
      provider,
      method,
      paymentId: paymentId || null,
      purchasedAt: serverTimestamp()
    });

    navigate(`/courses/${course.id}`);
  };

  const handleMockPay = async () => {
    setProcessing(true);
    try {
      await finalizePurchase({ paymentId: "mock_payment", provider: "mock" });
    } catch (err) {
      setError(err.message || "Unable to save purchase.");
    } finally {
      setProcessing(false);
    }
  };

  const handlePay = async () => {
    if (!course) return;
    setError("");

    if (priceInfo.isFree) {
      setProcessing(true);
      try {
        await finalizePurchase({ provider: "free" });
      } catch (err) {
        setError(err.message || "Unable to unlock course.");
      } finally {
        setProcessing(false);
      }
      return;
    }

    const numericPrice = Number(priceInfo.value);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setError("Invalid price configured for this course.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      navigate("/login");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`${API_BASE}/api/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericPrice,
          currency: "INR",
          courseId: course.id
        })
      });

      if (!response.ok) {
        throw new Error("Payment setup failed.");
      }

      const order = await response.json();
      if (!scriptReady || !window.Razorpay) {
        throw new Error("Razorpay script not loaded.");
      }

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "CrestUp Education",
        description: course.title,
        order_id: order.orderId,
        prefill: {
          email: user.email || ""
        },
        notes: {
          courseId: course.id,
          userId: user.uid,
          method
        },
        theme: {
          color: "#f9b233"
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          }
        },
        handler: async (payload) => {
          try {
            const verifyResponse = await fetch(
              `${API_BASE}/api/payments/verify`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: payload.razorpay_order_id,
                  paymentId: payload.razorpay_payment_id,
                  signature: payload.razorpay_signature
                })
              }
            );

            if (!verifyResponse.ok) {
              throw new Error("Payment verification failed.");
            }

            await finalizePurchase({
              paymentId: payload.razorpay_payment_id,
              provider: "razorpay"
            });
          } catch (err) {
            setError(err.message || "Payment verification failed.");
          } finally {
            setProcessing(false);
          }
        }
      });

      razorpay.on("payment.failed", (payload) => {
        setError(payload?.error?.description || "Payment failed.");
        setProcessing(false);
      });

      razorpay.open();
    } catch (err) {
      setMockMode(true);
      setError(
        "Razorpay keys not configured yet. Using demo mode until you add keys."
      );
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="panel">Loading payment...</div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="container">
        <div className="panel">{error}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h2>Purchase Course</h2>
          <p className="muted">Complete payment to start learning.</p>
        </div>
      </div>
      <div className="payment-card">
        <div>
          <h3>{course?.title}</h3>
          <p className="muted">{course?.description || "Course access"}</p>
        </div>
        <div className="payment-summary">
          <span>Total</span>
          <strong>{priceInfo.label}</strong>
        </div>
        <div className="payment-methods">
          <button
            className={`payment-option ${method === "card" ? "active" : ""}`}
            type="button"
            onClick={() => setMethod("card")}
          >
            Card
            <span className="payment-badge">Visa / Master</span>
          </button>
          <button
            className={`payment-option ${method === "upi" ? "active" : ""}`}
            type="button"
            onClick={() => setMethod("upi")}
          >
            UPI / GPay
            <span className="payment-badge">PhonePe / GPay</span>
          </button>
          <button
            className={`payment-option ${method === "qr" ? "active" : ""}`}
            type="button"
            onClick={() => setMethod("qr")}
          >
            Scan & Pay
            <span className="payment-badge">QR Code</span>
          </button>
        </div>
        {error ? <p className="payment-error">{error}</p> : null}
        <button
          className="btn primary"
          type="button"
          onClick={handlePay}
          disabled={processing}
        >
          {processing ? "Processing..." : "Pay with Razorpay"}
        </button>
        {mockMode ? (
          <button
            className="btn ghost"
            type="button"
            onClick={handleMockPay}
            disabled={processing}
          >
            Simulate Payment (Demo)
          </button>
        ) : null}
        <p className="payment-help muted">
          Razorpay will show Card, UPI (GPay), and QR options in the checkout.
        </p>
      </div>
    </div>
  );
}
