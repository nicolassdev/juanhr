@echo off
echo =============================================
echo  JuanHR v3 -- Windows Setup Script
echo =============================================
echo.

echo [1/4] Setting up Backend...
cd backend
copy .env.example .env
echo.
echo *** IMPORTANT: Open backend\.env and set your MySQL credentials! ***
echo Press any key to continue after editing .env ...
pause

npm install
echo Running database migrations...
npx prisma migrate dev --name init
echo Seeding database...
npx prisma db seed
echo Backend ready!
echo.

cd ..

echo [2/4] Setting up Frontend...
cd frontend
copy .env.example .env.local
npm install
echo Frontend ready!
cd ..

echo.
echo =============================================
echo  SETUP COMPLETE!
echo =============================================
echo.
echo To start the system:
echo.
echo  Terminal 1 (Backend):
echo    cd backend
echo    npm run start:dev
echo.
echo  Terminal 2 (Frontend):
echo    cd frontend
echo    npm run dev
echo.
echo  Open browser: http://localhost:3000
echo  Default login: admin@juanhr.com / Admin@123
echo.
pause
