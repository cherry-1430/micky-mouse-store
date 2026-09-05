import API_URL from "./apiConfig";

const PRODUCTS_API_URL = `${API_URL}/api/products`;

export async function getProducts() {
  const response = await fetch(PRODUCTS_API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  return response.json();
}

export async function getProduct(id) {
  const response = await fetch(`${PRODUCTS_API_URL}/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch product");
  }

  return response.json();
}