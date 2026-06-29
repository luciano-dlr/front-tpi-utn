import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        storeHome: resolve(__dirname, 'src/pages/store/home/home.html'),
        storeCart: resolve(__dirname, 'src/pages/store/cart/cart.html'),
        authLogin: resolve(__dirname, 'src/pages/auth/login/login.html'),
        authRegister: resolve(__dirname, 'src/pages/auth/register/register.html'),
        storeProductDetail: resolve(__dirname, 'src/pages/store/productDetail/productDetail.html'),
      },
    },
  },
  base: "./",
});
