import api from "./api";

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export async function registerUser(data: RegisterData) {
  const response = await api.post("/auth/register", data);
  return response.data;
}

export async function loginUser(
  email: string,
  password: string
) {
  const form = new URLSearchParams();

  // FastAPI OAuth2PasswordRequestForm
  form.append("username", email);
  form.append("password", password);

  const response = await api.post(
    "/auth/login",
    form,
    {
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data;
}
export async function getCurrentUser() {
    const response = await api.get("/auth/me");
    return response.data;
}