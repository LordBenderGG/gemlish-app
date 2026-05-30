@echo off
setlocal EnableExtensions

REM ==============================================================
REM COMPILADOR.BAT - Gemlish Build Console
REM 1) Compilar APK (pruebas locales)
REM 2) Verificar firma APK
REM 3) Compilar AAB (Play Store)
REM 4) Verificar firma AAB
REM ==============================================================

set "PROJECT_ROOT=%~dp0"
if "%PROJECT_ROOT:~-1%"=="\" set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"

set "ANDROID_DIR=%PROJECT_ROOT%\android"
set "APK_PATH=%ANDROID_DIR%\app\build\outputs\apk\release\app-release.apk"
set "AAB_PATH=%ANDROID_DIR%\app\build\outputs\bundle\release\app-release.aab"
set "OUTPUT_DIR=%PROJECT_ROOT%\compilado"
set "EXPECTED_SHA1_COLON=24:A6:84:49:D6:6C:65:1A:37:D4:B3:7F:DA:EB:07:AD:6A:A4:4A:8F"
set "EXPECTED_SHA1_NOCOLON=24A68449D66C651A37D4B37FDAEB07AD6AA44A8F"
for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "RUN_TS=%%I"
set "LOG_DIR=%PROJECT_ROOT%\logs"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%" >nul 2>&1
set "LOG_FILE=%LOG_DIR%\COMPILADOR_%RUN_TS%.log"
echo [%date% %time%] Inicio de COMPILADOR > "%LOG_FILE%"

call :setup_env
if errorlevel 1 goto :end

:menu
cls
echo ==============================================================
echo                  GEMLISH - COMPILADOR UNIFICADO
echo ==============================================================
echo Proyecto   : %PROJECT_ROOT%
echo Java       : %JAVA_HOME%
echo Android SDK: %ANDROID_HOME%
echo.
echo [1] Compilar APK (local)
echo [2] Verificar firma APK
echo [3] Compilar AAB (Play Store)
echo [4] Verificar firma AAB
echo [5] Salir
echo.
choice /c 12345 /n /m "Seleccione una opcion: "

if errorlevel 5 goto :end
if errorlevel 4 goto :verify_aab
if errorlevel 3 goto :build_aab
if errorlevel 2 goto :verify_apk
if errorlevel 1 goto :build_apk

:build_apk
cls
echo ==============================================================
echo Compilando APK de release (pruebas locales)
echo ==============================================================
echo Limpiando cache de Gradle y AdMob...
if exist "%ANDROID_DIR%\.gradle" rmdir /s /q "%ANDROID_DIR%\.gradle" >nul 2>&1
if exist "%ANDROID_DIR%\build" rmdir /s /q "%ANDROID_DIR%\build" >nul 2>&1
if exist "%ANDROID_DIR%\app\build\generated" rmdir /s /q "%ANDROID_DIR%\app\build\generated" >nul 2>&1
if exist "%PROJECT_ROOT%\node_modules\react-native-google-mobile-ads\android\build" rmdir /s /q "%PROJECT_ROOT%\node_modules\react-native-google-mobile-ads\android\build" >nul 2>&1
echo.
echo Comando: gradlew.bat assembleRelease --no-daemon --max-workers=2
echo.
pushd "%ANDROID_DIR%"
call gradlew.bat assembleRelease --no-daemon --max-workers=2 -Dorg.gradle.jvmargs="-Xmx4g -XX:MaxMetaspaceSize=1g"
set "BUILD_CODE=%errorlevel%"
popd

echo.
if not "%BUILD_CODE%"=="0" (
  echo ERROR: La compilacion fallo. Codigo: %BUILD_CODE%
  echo Revise el log mostrado arriba.
  goto :pause_menu
)

if exist "%APK_PATH%" (
  echo OK: APK generado en:
  echo %APK_PATH%
  for %%F in ("%APK_PATH%") do echo Tamano: %%~zF bytes
  if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%" >nul 2>&1
  copy /Y "%APK_PATH%" "%OUTPUT_DIR%\app-release.apk" >nul
  if errorlevel 1 (
    echo WARNING: No se pudo copiar el APK a %OUTPUT_DIR%
  ) else (
    echo Copia lista en: %OUTPUT_DIR%\app-release.apk
  )
) else (
  echo ERROR: Gradle reporto exito pero no se encontro el APK en la ruta esperada.
  echo Ruta esperada: %APK_PATH%
)
goto :pause_menu

:verify_apk
cls
echo ==============================================================
echo Verificando firma APK
echo ==============================================================
if not exist "%APK_PATH%" (
  echo ERROR: No existe APK.
  echo Primero ejecute la opcion [1].
  goto :pause_menu
)

call :find_apksigner
if errorlevel 1 (
  echo ERROR: No se encontro apksigner en build-tools.
  goto :pause_menu
)

set "TMPFILE=%TEMP%\gemlish_apk_sign_check.txt"
echo [%date% %time%] Opcion 2 - Verificar firma APK > "%TMPFILE%.meta"
call "%APKSIGNER%" verify --print-certs "%APK_PATH%" > "%TMPFILE%" 2>&1
set "VERIFY_CODE=%errorlevel%"
type "%TMPFILE%"
type "%TMPFILE%" >> "%LOG_FILE%"

if not "%VERIFY_CODE%"=="0" (
  echo.
  echo ERROR: La verificacion de firma del APK fallo. Codigo: %VERIFY_CODE%
  del "%TMPFILE%" >nul 2>&1
  goto :pause_menu
)

set "FOUND_SHA="
for /f "tokens=6" %%S in ('findstr /i /c:"SHA-1 digest:" "%TMPFILE%"') do set "FOUND_SHA=%%S"
if not defined FOUND_SHA (
  echo.
  echo ERROR: No se encontro la linea SHA-1 digest en la salida de apksigner.
  del "%TMPFILE%" >nul 2>&1
  del "%TMPFILE%.meta" >nul 2>&1
  goto :pause_menu
)
set "FOUND_SHA=%FOUND_SHA:"=%"
set "FOUND_SHA=%FOUND_SHA: =%"
for %%S in (%FOUND_SHA%) do set "FOUND_SHA=%%S"
set "FOUND_SHA_NORM=%FOUND_SHA::=%"

echo.
echo SHA-1 esperado : %EXPECTED_SHA1_COLON%
echo SHA-1 obtenido : %FOUND_SHA%
if /I "%FOUND_SHA_NORM%"=="%EXPECTED_SHA1_NOCOLON%" (
  echo RESULTADO      : COINCIDE ^(FIRMA CORRECTA^)
) else (
  echo RESULTADO      : NO COINCIDE ^(REVISAR KEYSTORE/FIRMA^)
)
del "%TMPFILE%" >nul 2>&1
del "%TMPFILE%.meta" >nul 2>&1
goto :pause_menu

:build_aab
cls
echo ==============================================================
echo Compilando AAB de release (Play Store)
echo ==============================================================
echo Limpiando cache de Gradle y AdMob...
if exist "%ANDROID_DIR%\.gradle" rmdir /s /q "%ANDROID_DIR%\.gradle" >nul 2>&1
if exist "%ANDROID_DIR%\build" rmdir /s /q "%ANDROID_DIR%\build" >nul 2>&1
if exist "%ANDROID_DIR%\app\build\generated" rmdir /s /q "%ANDROID_DIR%\app\build\generated" >nul 2>&1
if exist "%PROJECT_ROOT%\node_modules\react-native-google-mobile-ads\android\build" rmdir /s /q "%PROJECT_ROOT%\node_modules\react-native-google-mobile-ads\android\build" >nul 2>&1
echo.
echo Comando: gradlew.bat bundleRelease --no-daemon --max-workers=2
echo.
pushd "%ANDROID_DIR%"
call gradlew.bat bundleRelease --no-daemon --max-workers=2 -Dorg.gradle.jvmargs="-Xmx4g -XX:MaxMetaspaceSize=1g"
set "BUILD_CODE=%errorlevel%"
popd

echo.
if not "%BUILD_CODE%"=="0" (
  echo ERROR: La compilacion del AAB fallo. Codigo: %BUILD_CODE%
  echo Revise el log mostrado arriba.
  goto :pause_menu
)

if exist "%AAB_PATH%" (
  echo OK: AAB generado en:
  echo %AAB_PATH%
  for %%F in ("%AAB_PATH%") do echo Tamano: %%~zF bytes
  if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%" >nul 2>&1
  copy /Y "%AAB_PATH%" "%OUTPUT_DIR%\app-release.aab" >nul
  if errorlevel 1 (
    echo WARNING: No se pudo copiar el AAB a %OUTPUT_DIR%
  ) else (
    echo Copia lista en: %OUTPUT_DIR%\app-release.aab
  )
) else (
  echo ERROR: Gradle reporto exito pero no se encontro el AAB en la ruta esperada.
  echo Ruta esperada: %AAB_PATH%
)
goto :pause_menu

:verify_aab
cls
echo ==============================================================
echo Verificando firma AAB
echo ==============================================================
if not exist "%AAB_PATH%" (
  echo ERROR: No existe AAB.
  echo Primero ejecute la opcion [3].
  goto :pause_menu
)

set "KEYTOOL_EXE=%JAVA_HOME%\bin\keytool.exe"
if not exist "%KEYTOOL_EXE%" (
  echo ERROR: No se encontro keytool en %KEYTOOL_EXE%
  goto :pause_menu
)

set "TMPFILE=%TEMP%\gemlish_aab_sign_check.txt"
echo [%date% %time%] Opcion 4 - Verificar firma AAB > "%TMPFILE%.meta"
"%KEYTOOL_EXE%" -printcert -jarfile "%AAB_PATH%" > "%TMPFILE%" 2>&1
set "VERIFY_CODE=%errorlevel%"
type "%TMPFILE%"
type "%TMPFILE%" >> "%LOG_FILE%"

if not "%VERIFY_CODE%"=="0" (
  echo.
  echo ERROR: La verificacion de firma del AAB fallo con keytool. Codigo: %VERIFY_CODE%
  del "%TMPFILE%" >nul 2>&1
  goto :pause_menu
)

set "FOUND_SHA="
for /f "tokens=2" %%S in ('findstr /i /c:"SHA1:" "%TMPFILE%"') do set "FOUND_SHA=%%S"
if not defined FOUND_SHA (
  echo.
  echo ERROR: No se encontro la linea SHA1 en la salida de keytool.
  del "%TMPFILE%" >nul 2>&1
  del "%TMPFILE%.meta" >nul 2>&1
  goto :pause_menu
)
set "FOUND_SHA=%FOUND_SHA:"=%"
set "FOUND_SHA=%FOUND_SHA: =%"
for %%S in (%FOUND_SHA%) do set "FOUND_SHA=%%S"
set "FOUND_SHA_NORM=%FOUND_SHA::=%"

echo.
echo SHA-1 esperado : %EXPECTED_SHA1_COLON%
echo SHA-1 obtenido : %FOUND_SHA%
if /I "%FOUND_SHA_NORM%"=="%EXPECTED_SHA1_NOCOLON%" (
  echo RESULTADO      : COINCIDE ^(FIRMA CORRECTA^)
) else (
  echo RESULTADO      : NO COINCIDE ^(REVISAR KEYSTORE/FIRMA^)
)
del "%TMPFILE%" >nul 2>&1
del "%TMPFILE%.meta" >nul 2>&1
goto :pause_menu

:setup_env
if not defined JAVA_HOME set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
if not defined ANDROID_HOME set "ANDROID_HOME=C:\Users\USUARIO\AppData\Local\Android\Sdk"
if not defined ANDROID_SDK_ROOT set "ANDROID_SDK_ROOT=%ANDROID_HOME%"

if not exist "%ANDROID_DIR%\gradlew.bat" (
  echo ERROR: No se encontro gradlew.bat en %ANDROID_DIR%
  exit /b 1
)
if not exist "%JAVA_HOME%\bin\java.exe" (
  echo ERROR: Java no encontrado en %JAVA_HOME%
  exit /b 1
)

set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"
set "NODE_ENV=production"
exit /b 0

:find_apksigner
set "APKSIGNER="
if exist "%ANDROID_HOME%\build-tools\36.0.0\apksigner.bat" (
  set "APKSIGNER=%ANDROID_HOME%\build-tools\36.0.0\apksigner.bat"
  exit /b 0
)

for /f "delims=" %%D in ('dir /b /ad "%ANDROID_HOME%\build-tools" ^| sort /r') do (
  if exist "%ANDROID_HOME%\build-tools\%%D\apksigner.bat" (
    set "APKSIGNER=%ANDROID_HOME%\build-tools\%%D\apksigner.bat"
    exit /b 0
  )
)
exit /b 1

:pause_menu
echo.
echo Presione una tecla para volver al menu...
echo Log de esta sesion: %LOG_FILE%
pause >nul
goto :menu

:end
echo.
echo Saliendo de COMPILADOR...
echo Presione una tecla para terminar.
pause >nul
exit /b 0
