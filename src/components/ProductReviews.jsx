import { useEffect, useState } from "react";
import API_URL from "../api/apiConfig";
import "./ProductReviews.css";

function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/reviews/product/${productId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch reviews"
        );
      }

      setReviews(data);
    } catch (error) {
      console.error("Reviews error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!comment.trim()) {
      alert("Please write a review.");
      return;
    }

    try {
      setSubmitting(true);

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login to write a review.");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId,
            rating,
            comment,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to submit review"
        );
      }

      setComment("");
      setRating(5);
      setShowForm(false);

      await fetchReviews();

      alert("Review submitted successfully!");
    } catch (error) {
      console.error("Submit review error:", error);
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (total, review) => total + review.rating,
            0
          ) / reviews.length
        ).toFixed(1)
      : "0.0";

  return (
    <section className="product-reviews">

      <div className="reviews-heading">

        <div>
          <span>WHAT CUSTOMERS SAY</span>
          <h2>CUSTOMER REVIEWS</h2>
        </div>

       <button
  className="write-review-button"
  onClick={() => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login to write a review.");
      return;
    }

    setShowForm(!showForm);
  }}
>
  {showForm ? "CLOSE" : "WRITE A REVIEW"}
</button>

      </div>

      {/* REVIEW SUMMARY */}

      <div className="review-summary">

        <div className="review-score">
          <strong>{averageRating}</strong>

          <span>
            {"★".repeat(
              Math.round(Number(averageRating))
            )}
            {"☆".repeat(
              5 - Math.round(Number(averageRating))
            )}
          </span>

          <small>
            {reviews.length}{" "}
            {reviews.length === 1
              ? "review"
              : "reviews"}
          </small>
        </div>
        <div className="review-summary-note">
  <span>✓</span>
  <p>
    Reviews are available to customers who have
    purchased this product.
  </p>
</div>

      </div>

      {/* REVIEW FORM */}

      {showForm && (
        <form
          className="review-form"
          onSubmit={handleSubmitReview}
        >

          <h3>WRITE YOUR REVIEW</h3>

          <div className="review-rating-selector">

            <span>YOUR RATING</span>

            <div>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className={
                    star <= rating
                      ? "active-star"
                      : ""
                  }
                >
                  ★
                </button>
              ))}
            </div>

          </div>

          <textarea
            value={comment}
            onChange={(e) =>
              setComment(e.target.value)
            }
            placeholder="Share your experience with this product..."
            rows="5"
            maxLength="1000"
          />

          <div className="review-form-bottom">

            <small>
              {comment.length}/1000
            </small>

            <button
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "SUBMITTING..."
                : "SUBMIT REVIEW →"}
            </button>

          </div>

        </form>
      )}

      {/* REVIEWS */}

      {loading && (
        <p className="reviews-message">
          Loading reviews...
        </p>
      )}

      {error && (
        <p className="reviews-error">
          {error}
        </p>
      )}

      {!loading && !error && reviews.length === 0 && (
        <div className="no-reviews">
          <span>NO REVIEWS YET</span>
          <h3>BE THE FIRST TO REVIEW THIS PRODUCT</h3>
          <p>
            Share your experience with other
            Micky Mouse customers.
          </p>
        </div>
      )}

      <div className="reviews-list">

        {reviews.map((review) => (

          <article
            className="review-card"
            key={review._id}
          >

            <div className="review-card-top">

              <div>

                <strong>
                  {review.user?.name ||
                    review.userName ||
                    "Customer"}
                </strong>

                <div className="review-stars">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </div>

              </div>

              {review.isVerifiedPurchase && (
                <span className="verified-review">
                  ✓ VERIFIED PURCHASE
                </span>
              )}

            </div>

            <p>{review.comment}</p>

            {review.createdAt && (
              <small>
                {new Date(
                  review.createdAt
                ).toLocaleDateString("en-IN")}
              </small>
            )}

          </article>

        ))}

      </div>

    </section>
  );
}

export default ProductReviews;