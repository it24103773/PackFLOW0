@REM ----------------------------------------------------------------------------
@REM Maven Start Up Batch script for PackFlow Backend
@REM ----------------------------------------------------------------------------

@IF "%DEBUG%" == "" @ECHO off
@SETLOCAL

SET MAVEN_CMD_LINE_ARGS=%*

IF NOT "%JAVA_HOME%" == "" goto HaveJavaHome

SET JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
IF "%ERRORLEVEL%" == "0" goto Execute

ECHO JAVA_HOME is not set and no 'java' command could be found in your PATH.
GOTO Failed

:HaveJavaHome
SET JAVA_EXE="%JAVA_HOME%\bin\java.exe"

:Execute
%JAVA_EXE% -cp "%~dp0.mvn\wrapper\maven-wrapper.jar" "-Dmaven.home=%~dp0.mvn\wrapper" org.apache.maven.wrapper.MavenWrapperMain %MAVEN_CMD_LINE_ARGS%
IF "%ERRORLEVEL%" == "0" goto End

:Failed
ENDLOCAL
EXIT /B 1

:End
ENDLOCAL
EXIT /B 0
