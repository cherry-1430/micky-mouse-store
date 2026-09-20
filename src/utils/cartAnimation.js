export function animateToCart(
  image,
  sourceElement
) {
  const cartElement =
    document.getElementById("navbar-cart");

  if (!cartElement || !sourceElement || !image) {
    return;
  }

  const sourceRect =
    sourceElement.getBoundingClientRect();

  const cartRect =
    cartElement.getBoundingClientRect();

  const flyingImage =
    document.createElement("img");

  flyingImage.src = image;

  flyingImage.className =
    "fly-to-cart";

  flyingImage.style.left =
    `${sourceRect.left}px`;

  flyingImage.style.top =
    `${sourceRect.top}px`;

  const startX =
    sourceRect.left;

  const startY =
    sourceRect.top;

  const targetX =
    cartRect.left - startX;

  const targetY =
    cartRect.top - startY;

  flyingImage.style.setProperty(
    "--cart-x",
    `${targetX}px`
  );

  flyingImage.style.setProperty(
    "--cart-y",
    `${targetY}px`
  );

  document.body.appendChild(
    flyingImage
  );

  setTimeout(() => {
    flyingImage.remove();

    cartElement.classList.add(
      "cart-bounce"
    );

    setTimeout(() => {
      cartElement.classList.remove(
        "cart-bounce"
      );
    }, 500);
  }, 800);
}