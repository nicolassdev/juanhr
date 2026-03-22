import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import * as cookieParser from "cookie-parser";
import { join } from "path";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as fs from "fs";

// Fix BigInt serialization globally
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  });

  // Resolve uploads path from project root (works whether running from src/ or dist/)
  // process.cwd() always points to where you ran "npm run start:dev" — the backend folder
  const uploadsPath = join(process.cwd(), "uploads");

  // Auto-create upload subdirectories if they don't exist
  ["uploads", "uploads/avatars", "uploads/selfies"].forEach((dir) => {
    const full = join(process.cwd(), dir);
    if (!fs.existsSync(full)) {
      fs.mkdirSync(full, { recursive: true });
      console.log(`📁 Created: ${full}`);
    }
  });

  // Serve uploads as static files at /uploads
  app.useStaticAssets(uploadsPath, { prefix: "/uploads" });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 JuanHR API running at http://localhost:${port}/api/v1`);
  console.log(`📂 Uploads served from: ${uploadsPath}`);
}
bootstrap();
