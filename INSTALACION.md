# 🧰 Guía de instalación: prepara tu computadora

Antes de la práctica necesitas **5 programas**. Esta guía te dice cómo instalar cada uno y
cómo comprobar que funciona. ⏱️ Si no tienes ninguno, calcula unos **20 a 30 minutos**.

| # | Programa | ¿Para qué lo usamos? | ¿Obligatorio? |
|---|---|---|---|
| 1 | **Git** | Guardar versiones del código y subirlo a GitHub | ✅ Sí |
| 2 | **Node.js** (incluye **npm**) | Correr y compilar el tablero en React | ✅ Sí |
| 3 | **Terraform** | Crear la infraestructura en AWS con código | ✅ Sí |
| 4 | **AWS CLI** | Conectar tu computadora con AWS | ✅ Sí |
| 5 | **GitHub CLI** (`gh`) | Iniciar sesión en GitHub desde la terminal | 🟡 Recomendado |
| ➕ | **VS Code** | Editar el código cómodamente | 🟡 Opcional |

> ¿Ya tienes alguno? Sáltate a **[✅ Comprueba que todo funciona](#-comprueba-que-todo-funciona)**
> y solo instala lo que te falte.

## 🔒 Antes de instalar: reglas de seguridad

En 2025 y 2026 hubo **ataques a la "cadena de suministro"**: delincuentes infectaron
paquetes **legítimos** de npm (los "Shai-Hulud" / "ChainDrop", el más reciente en
**octubre de 2026**). Con solo hacer `npm install` de un paquete infectado, el malware
robaba contraseñas y tokens. Para protegerte:

1. **Descarga SIEMPRE de la página oficial** (los links de esta guía). Nunca de sitios
   de "descargas gratis" ni de links que te pasen por chat.
2. **Instala la versión más reciente**, no una que ya tenías guardada. Las versiones
   nuevas traen **parches de seguridad**. Si ya tenías un programa, **actualízalo**.
3. **Node.js:** usa la versión **LTS** más reciente (v26 en noviembre de 2026). El proyecto
   **no deja instalar** con versiones menores a v24.
4. **No instales paquetes de npm que no conozcas**, aunque un tutorial lo diga. Antes,
   búscalo en https://www.npmjs.com y revisa que sea popular y esté mantenido.
5. **Usa `npm ci`** (no `npm install`) cuando solo quieras instalar lo del proyecto:
   instala **exactamente** las versiones revisadas que están en `package-lock.json`.

> 🛡️ **El proyecto ya viene protegido:** su archivo `.npmrc` evita que los paquetes
> ejecuten scripts al instalarse (así se propagaban los gusanos), y el pipeline revisa
> vulnerabilidades y **firmas** de los paquetes en cada cambio.

### ¿Ya tenías los programas? Actualízalos

**Windows (CMD):**
```bat
winget upgrade --id Git.Git -e
winget upgrade --id OpenJS.NodeJS.LTS -e
winget upgrade --id Hashicorp.Terraform -e
winget upgrade --id Amazon.AWSCLI -e
winget upgrade --id GitHub.cli -e
```
O descarga de nuevo el instalador desde la página oficial e instálalo encima.

**Mac:** `brew update && brew upgrade git node awscli gh hashicorp/tap/terraform`

---

## 🪟 Windows

### ⚡ Opción rápida: todo con un comando (Windows 10/11)

1. Abre el menú Inicio, escribe **cmd** y abre **Símbolo del sistema**.
2. Copia y pega este comando y presiona Enter:

```bat
winget install --id Git.Git -e && winget install --id OpenJS.NodeJS.LTS -e && winget install --id Hashicorp.Terraform -e && winget install --id Amazon.AWSCLI -e && winget install --id GitHub.cli -e
```

3. Acepta los mensajes que aparezcan (escribe `Y` si te pregunta y da **Sí** a las ventanas de permisos).
4. **Cierra CMD y vuelve a abrirlo** (¡importante!).
5. Ve a **[✅ Comprueba que todo funciona](#-comprueba-que-todo-funciona)**.

> ¿Dice que `winget` no se reconoce como un comando? Usa la opción paso a paso de abajo.

### 🐢 Opción paso a paso (con instaladores)

#### 1. Git
1. Descarga: https://git-scm.com/download/win (empieza solo; si no, elige **64-bit Git for Windows Setup**).
2. Abre el instalador y da **Next** en todo (las opciones que trae están bien).
3. Comprueba en una CMD **nueva**: `git --version`

#### 2. Node.js (trae npm)
1. Descarga: https://nodejs.org. Elige el botón de la versión **LTS** (la recomendada; en noviembre de 2026 es la **v26**). Mínimo v24.
2. Abre el instalador → **Next** en todo → **Install**.
   (Si te pregunta por "Tools for Native Modules", **no** hace falta marcarlo.)
3. Comprueba: `node --version` y `npm --version`

#### 3. Terraform
Terraform no tiene instalador con "Siguiente, Siguiente". Hay dos formas:

**Forma fácil** (en CMD):
```bat
winget install --id Hashicorp.Terraform -e
```

**Forma manual** (si no tienes winget):
1. Descarga: https://developer.hashicorp.com/terraform/install → **Windows** → **AMD64** (un `.zip`).
2. Crea la carpeta `C:\terraform` y descomprime ahí el archivo `terraform.exe`.
3. Agrega esa carpeta al **PATH**, para que Windows encuentre el comando:
   - Inicio → escribe **variables de entorno** → **Editar las variables de entorno del sistema**.
   - Botón **Variables de entorno…**
   - En la parte de arriba (variables de tu usuario) selecciona **Path** → **Editar** → **Nuevo** → escribe `C:\terraform` → **Aceptar** en todas las ventanas.
4. Comprueba en una CMD **nueva**: `terraform version`

#### 4. AWS CLI
1. Descarga: https://awscli.amazonaws.com/AWSCLIV2.msi
2. Abre el instalador → **Next** → **Next** → **Install** → **Finish**.
3. Comprueba en una CMD **nueva**: `aws --version`

#### 5. GitHub CLI (recomendado)
1. Descarga: https://cli.github.com → botón **Download for Windows**.
2. Instala con **Next** en todo.
3. Comprueba: `gh --version`

#### ➕ VS Code (opcional)
https://code.visualstudio.com → **Download for Windows** → instala.
Marca la casilla **"Agregar a PATH"** para poder abrir carpetas con `code .`

---

## 🍎 Mac

1. Abre la app **Terminal** (búscala con `Cmd + Espacio`).
2. Instala **Homebrew** (el "instalador de programas" de Mac) si no lo tienes:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
   Al terminar, **sigue las instrucciones que te muestra** (te pide copiar 2 líneas para agregarlo al PATH).
3. Instala todo:
   ```bash
   brew install git node awscli gh
   brew tap hashicorp/tap
   brew install hashicorp/tap/terraform
   ```
4. Cierra y vuelve a abrir la Terminal.

---

## 🐧 Linux (Ubuntu / Debian)

```bash
sudo apt update && sudo apt install -y git curl unzip

# Node.js LTS (v26)
curl -fsSL https://deb.nodesource.com/setup_26.x | sudo -E bash -
sudo apt install -y nodejs

# Terraform
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install -y terraform

# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip
unzip awscliv2.zip && sudo ./aws/install

# GitHub CLI
sudo apt install -y gh
```

---

## ✅ Comprueba que todo funciona

Abre una terminal **nueva** (CMD en Windows, Terminal en Mac/Linux) y corre uno por uno:

```bash
git --version
node --version
npm --version
terraform version
aws --version
gh --version
```

Debes ver algo parecido a esto. Son las versiones de **noviembre de 2026**; si las tuyas son **más nuevas**, mejor:

```
git version 2.56.0
v26.13.0               ← v26 (recomendada) o mínimo v24
11.20.0
Terraform v1.17.1
aws-cli/2.39.7 ...     ← debe empezar con aws-cli/2
gh version 2.103.3
```

🎉 **¡Si todos responden con un número, estás listo!**

---

## 🔗 Último paso: conecta Git con tu GitHub (una sola vez)

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "el-correo-de-tu-github@ejemplo.com"
git config --global init.defaultBranch main

gh auth login
```

En `gh auth login` elige: **GitHub.com** → **HTTPS** → **Yes** → **Login with a web browser**.
Copia el código que aparece y pégalo en la página que se abre.

✅ Comprueba con `gh auth status`: debe decir **Logged in to github.com**.

---

## 🆘 Si algo sale mal

| Problema | Solución |
|---|---|
| `"xxx" no se reconoce como un comando interno o externo` | **Cierra y vuelve a abrir la terminal.** Si sigue igual, reinicia la computadora. Si aun así no, reinstala ese programa. |
| `node --version` dice v22 o menor | Tienes una versión vieja: instala la **LTS** de https://nodejs.org encima |
| `npm install` dice `Unsupported engine` o `EBADENGINE` | Tu Node es más viejo que v24: instala la **LTS** más reciente de https://nodejs.org |
| `terraform` no se reconoce (instalación manual) | Revisa que `terraform.exe` esté en `C:\terraform` y que esa carpeta esté en el **Path** (paso 3 de Terraform) |
| `aws --version` dice `aws-cli/1...` | Tienes la versión 1 (vieja). Instala la versión 2 con el `.msi` de arriba |
| PowerShell dice que *la ejecución de scripts está deshabilitada* | Usa **CMD**, o en PowerShell corre una vez: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| El instalador pide contraseña de administrador | En computadoras de la escuela o del trabajo, pídele ayuda a quien la administra |
| `winget` no se reconoce | Actualiza **App Installer** desde la Microsoft Store, o usa la opción paso a paso |

¿Listo? 👉 Sigue con la **[GUIA.md](GUIA.md)**.
