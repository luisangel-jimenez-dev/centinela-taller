# 📘 Guía paso a paso: publica tu propio Centinela

Al terminar tendrás **tu propio tablero de sismos en internet**, con una URL
como `https://main.d1abc2xyz.amplifyapp.com`, que **se actualiza solo cada hora**.

⏱️ Tiempo aproximado: 1 a 2 horas la primera vez.

> 🔑 **Regla de oro:** en toda la guía, donde diga `TUNOMBRE` pon **tu nombre en
> minúsculas y con guiones**, por ejemplo `juan-perez`. Usa **siempre el mismo**.
> Sirve para que tus recursos en AWS no choquen con los de tus compañeros.

---

## Paso 0: Lo que necesitas

### Cuentas (gratis)
- [ ] Cuenta de **GitHub**: https://github.com/signup
- [ ] Cuenta de **AWS**: https://aws.amazon.com/free (pide tarjeta, pero con la capa gratuita esta práctica cuesta **$0 o centavos**)

### Programas en tu computadora
| Programa | Para qué | Cómo comprobar que ya lo tienes |
|---|---|---|
| [Git](https://git-scm.com/downloads) | Control de versiones | `git --version` |
| [Node.js LTS más reciente](https://nodejs.org) (mínimo v24, trae npm) | Correr JavaScript e instalar dependencias | `node --version` y `npm --version` |
| [Terraform (última versión)](https://developer.hashicorp.com/terraform/install) | Infraestructura como código | `terraform version` |
| [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) | Hablar con AWS desde la terminal | `aws --version` |
| [GitHub CLI](https://cli.github.com) | Iniciar sesión en GitHub desde la terminal | `gh --version` |

> 📦 **¿Te falta alguno?** Sigue la **[INSTALACION.md](INSTALACION.md)**: tiene el paso a paso
> para Windows, Mac y Linux, y cómo comprobar que todo quedó bien.

> 🪟 **¿Usas Windows?** No necesitas WSL ni Linux. Todo funciona en **CMD** o **PowerShell**.
> - **Después de instalar, cierra y vuelve a abrir la terminal** para que reconozca los comandos nuevos.
> - Casi todos los comandos de esta guía son iguales en Windows. Cuando alguno cambie, verás su versión para **🪟 Windows (CMD)**.

### Conecta Git con tu cuenta de GitHub (una sola vez)

```bash
git config --global user.name "Juan Pérez"
git config --global user.email "el-correo-de-tu-github@ejemplo.com"
git config --global init.defaultBranch main

gh auth login
```

En `gh auth login` elige: **GitHub.com** → **HTTPS** → **Yes** (autenticar Git) → **Login with a web browser**.
Copia el código que te muestra y pégalo en el navegador que se abre.

✅ Comprueba con `gh auth status`: debe decir **Logged in to github.com**.

> ⚠️ GitHub **ya no acepta tu contraseña** al hacer `git push`. Por eso usamos `gh auth login`.

### 🛡️ Antes de empezar, protege tu cuenta de AWS (5 minutos)
1. **Activa MFA** (verificación en dos pasos) en tu usuario raíz: consola de AWS → tu nombre (arriba a la derecha) → *Security credentials* → *Assign MFA device*.
2. **Crea una alerta de gastos**: busca **Budgets** → *Create budget* → plantilla **Zero spend budget** → tu correo. AWS te avisará si gastas aunque sea 1 centavo.

---

## Paso 1: Tu copia del proyecto

1. Entra al repositorio que te compartió tu profe.
2. Da clic en el botón verde **Use this template** → **Create a new repository**.
   - Nombre: `centinela-sismos`
   - Visibilidad: **Public** (en repos públicos los minutos de GitHub Actions son gratis e ilimitados)
3. Clónalo y pruébalo en tu compu:

```bash
git clone https://github.com/TU-USUARIO/centinela-sismos.git
cd centinela-sismos
npm ci          # instala las dependencias (versiones exactas y revisadas)
npm run datos      # descarga sismos reales del SSN
npm run dev        # abre http://localhost:5173
```

✅ **Debes ver** el tablero con el mapa y los últimos sismos. Para detenerlo: `Ctrl + C`.

> ¿Hiciste *fork* en vez de usar la plantilla? Ve a la pestaña **Actions** de tu
> repo y da clic en **"I understand my workflows, go ahead and enable them"**.

---

## Paso 2: Conecta tu computadora con AWS

Esta conexión solo la usas **una vez** para el Paso 3. Después, GitHub trabaja solo.

La forma más fácil (AWS CLI 2.32 o más reciente):

```bash
aws login
```

Se abre el navegador, entras con tu cuenta de AWS y listo.

> ⚠️ **¿Dice `Profile 'default' is already configured with Access Key credentials`?** Ya tenías
> AWS configurado de antes. Inicia sesión en un perfil nuevo y dile a la terminal que lo use:
> ```bash
> aws login --profile centinela
> export AWS_PROFILE=centinela        # 🪟 CMD: set AWS_PROFILE=centinela
> ```
> Repite la segunda línea **cada vez que abras una terminal nueva**.
>
> ⏰ La sesión dura unas horas. Si más tarde algo dice `session has expired`, vuelve a correr `aws login`.

<details>
<summary>¿No te funciona <code>aws login</code>, o Terraform dice que no encuentra credenciales? Usa llaves de acceso</summary>

1. En la consola de AWS ve a **IAM** → *Users* → *Create user* → nombre `admin-TUNOMBRE`.
2. Permisos: *Attach policies directly* → **AdministratorAccess**.
3. Entra al usuario → *Security credentials* → *Create access key* → *Command Line Interface (CLI)*.
4. En tu terminal:
   ```bash
   aws configure
   # AWS Access Key ID:     (pega la llave)
   # AWS Secret Access Key: (pega el secreto)
   # Default region name:   us-east-1
   # Default output format: json
   ```
⚠️ **Nunca** subas estas llaves a GitHub ni las compartas. Bórralas al terminar la práctica.
</details>

Comprueba que quedó:

```bash
aws sts get-caller-identity
```

✅ **Debes ver** un JSON con tu número de cuenta (`"Account": "123456789012"`).

### ¿Tengo permisos para crear todo? (sin crear nada)

```bash
npm run permisos
```

Este script le **pregunta** a AWS si tu usuario puede crear buckets, roles,
CloudFront y Amplify, pero **no crea nada**.

✅ **Debes ver** puras palomitas y `¡Tienes todos los permisos!`. Si sale alguna ❌, pídele
a tu profe o al dueño de la cuenta el permiso que falta.

---

## Paso 3: Bootstrap (preparar AWS para GitHub): una sola vez

Aquí creamos 3 cosas que el pipeline necesita **antes** de poder trabajar solo:

| Qué se crea | Para qué |
|---|---|
| Bucket `centinela-TUNOMBRE-tfstate` | Guardar el **estado** de Terraform (su "memoria") |
| Proveedor **OIDC** de GitHub | Que AWS confíe en GitHub **sin contraseñas** |
| Rol `centinela-TUNOMBRE-github` | Los permisos **mínimos** que tendrá el robot |

```bash
cd bootstrap
cp terraform.tfvars.example terraform.tfvars
```

🪟 **Windows (CMD):**
```bat
cd bootstrap
copy terraform.tfvars.example terraform.tfvars
```

> 💡 Para editarlo en Windows: `notepad terraform.tfvars`. En cualquier sistema también puedes usar VS Code: `code terraform.tfvars`.

Abre `bootstrap/terraform.tfvars` y cambia los valores:

```hcl
alumno      = "juan-perez"                  # TUNOMBRE
github_repo = "juanperez/centinela-sismos"  # tu-usuario-de-github/tu-repo
```

Ahora:

```bash
terraform init      # descarga el "plugin" de AWS
terraform plan      # muestra qué va a crear (léelo)
terraform apply     # escribe "yes" para confirmar
```

✅ **Al final debes ver** algo así. ¡Cópialo, lo usarás en el Paso 4!

```
Outputs:

ALUMNO          = "juan-perez"
AWS_ROLE_ARN    = "arn:aws:iam::123456789012:role/centinela-juan-perez-github"
TF_STATE_BUCKET = "centinela-juan-perez-tfstate"
```

> ⚠️ No borres el archivo `bootstrap/terraform.tfstate`: lo necesitas para limpiar al final.
> (No te preocupes, `.gitignore` evita que se suba a GitHub.)

Regresa a la carpeta principal:

```bash
cd ..
```

---

## Paso 4: Configura tu repositorio en GitHub

### 4.1 Variables
En tu repo: **Settings** → **Secrets and variables** → **Actions** → pestaña **Variables** → **New repository variable**.

Crea estas 3 (con los valores del Paso 3):

| Name | Value (ejemplo) |
|---|---|
| `ALUMNO` | `juan-perez` |
| `AWS_ROLE_ARN` | `arn:aws:iam::123456789012:role/centinela-juan-perez-github` |
| `TF_STATE_BUCKET` | `centinela-juan-perez-tfstate` |

> 🤔 **¿Y las contraseñas de AWS?** ¡No hay! Gracias a **OIDC**, GitHub le pide a
> AWS credenciales temporales que duran 1 hora. No hay nada secreto que se pueda robar.

### 4.2 Ambiente "produccion"
**Settings** → **Environments** → **New environment** → nombre: `produccion` (sin acento) → **Configure environment**.

Opcional: marca **Required reviewers** y ponte a ti. Así, antes de publicar el
tablero, GitHub te pedirá aprobarlo con un botón. ¡Como en las empresas!

---

## Paso 5: ¡Primer despliegue! 🚀

1. Ve a la pestaña **Actions** de tu repo.
2. A la izquierda elige **Centinela CI/CD** → botón **Run workflow** → **Run workflow**.
3. Da clic en la ejecución para verla en vivo. Verás 4 jobs:

```
1 · Calidad (lint, pruebas, build) ───────────────┐
                                                  ├──▶ 4 · Publicar tablero (Amplify)
2 · Infraestructura (Terraform) ──┬───────────────┘
                                  └──▶ 3 · Actualizar datos de sismos
```

⏱️ La primera vez tarda **5 a 10 minutos** (CloudFront tarda en crearse).

4. Cuando todo esté en verde ✅, abre el job **4 · Publicar tablero** y en el **resumen**
   verás la URL de tu tablero. También aparece en *Settings → Environments → produccion*.

🎉 **¡Ábrela! Ese es TU tablero en internet.**

---

## Paso 6: Verifica que todo funciona

- [ ] **El tablero abre** con HTTPS (candado 🔒) en `https://main.xxxx.amplifyapp.com`
- [ ] **Los datos abren directo** en `https://xxxx.cloudfront.net/sismos.json` (búscala en el resumen)
- [ ] **El bucket es privado**: en la consola de **S3**, abre `centinela-TUNOMBRE-datos` → `sismos.json` → copia la *Object URL* y ábrela. Debe decir **AccessDenied**. ✅ ¡Eso es bueno! Solo CloudFront puede leerlo.
- [ ] **Se actualiza solo**: espera a la siguiente hora y revisa en **Actions** que corrió una ejecución tipo `schedule` (solo corren los jobs 2 y 3).
- [ ] **En la consola de AWS** encuentra tu app en **Amplify** y tu distribución en **CloudFront**.

---

## Paso 7: Trabaja como profesional (ramas y Pull Requests)

### 7.1 Protege la rama main
**Settings** → **Rules** → **Rulesets** → **New ruleset** → **New branch ruleset**:
- Ruleset name: `proteger-main`
- Enforcement status: **Active**
- Target branches: **Add target** → **Include default branch**
- Marca **Require a pull request before merging**
- Marca **Require status checks to pass** → **Add checks** → agrega `1 · Calidad (lint, pruebas, build)` y `2 · Infraestructura (Terraform)`
- Marca **Block force pushes** → **Create**

Ahora **nadie** (ni tú) puede subir cambios directo a `main` sin pasar las revisiones.

### 7.2 Haz un cambio con Pull Request
```bash
git checkout -b mi-primer-cambio
```

Abre `src/components/Encabezado.jsx` y cambia el título, por ejemplo:
`Monitoreo sísmico de México` → `Centinela de Juan: sismos en México`

```bash
git add .
git commit -m "Cambia el título del tablero"
git push -u origin mi-primer-cambio
```

En GitHub aparecerá el botón **Compare & pull request** → **Create pull request**.

✅ **Observa:** el robot corre **Calidad** y el **plan** de Terraform, pero **no publica nada**.
Cuando todo esté en verde → **Merge pull request** → y ahora sí se publica solo. 🎉

### 7.3 Rompe algo a propósito 😈
Crea otra rama y en `scripts/sismos.test.mjs` cambia `assert.equal(sismos.length, 2)` por
`assert.equal(sismos.length, 99)`. Haz push y abre un PR: el job de **Calidad** se pone en ❌
y GitHub **no te deja hacer merge**. ¡Así el pipeline evita que un error llegue a producción!

---

## Paso 8: Limpieza (cuando terminen la práctica) 🧹

Para no dejar nada corriendo en AWS:

1. En GitHub: **Actions** → **Centinela CI/CD** → **⋯** → **Disable workflow**.
2. En tu terminal:

```bash
# Borra la infraestructura del proyecto (S3 de datos, CloudFront, Amplify)
cd infra
terraform init -backend-config="bucket=centinela-TUNOMBRE-tfstate"
terraform destroy -var="alumno=TUNOMBRE"      # escribe "yes"

# Borra el bootstrap (bucket del estado, OIDC y rol)
cd ../bootstrap
terraform destroy                              # escribe "yes"
```

3. Si creaste llaves de acceso en el Paso 2, bórralas en **IAM** → tu usuario → *Security credentials*.

> CloudFront tarda unos minutos en borrarse: es normal que `destroy` se quede "esperando".

---

## 🆘 Problemas comunes

| Error | Qué significa | Solución |
|---|---|---|
| `InvalidClientTokenId` o `security token included in the request is invalid` (en tu compu) | Terraform está usando otra cuenta (una vieja o vencida), no la tuya | Si iniciaste sesión con `--profile`, en **esa misma terminal** corre `set AWS_PROFILE=tu-perfil` (CMD) o `export AWS_PROFILE=tu-perfil` (Mac/Linux). Si dice `session has expired`, repite `aws login` |
| `BucketAlreadyExists` | Alguien en el mundo ya usa ese nombre de bucket | Cambia `alumno` por algo más único, ej: `juan-perez-2026` (en **todos** lados) |
| `EntityAlreadyExists ... oidc-provider` | Tu cuenta ya tiene el proveedor OIDC de GitHub | En `bootstrap/terraform.tfvars` pon `crear_proveedor_oidc = false` y repite `terraform apply` |
| `Not authorized to perform sts:AssumeRoleWithWebIdentity` | AWS no reconoce tu repo | Revisa que `github_repo` en el bootstrap sea **exactamente** `usuario/repo` (el de tu copia, no el de la plantilla), y que el ambiente se llame `produccion`. Si lo corriges, vuelve a hacer `terraform apply` en `bootstrap` |
| `Could not load credentials` | Falta una variable en GitHub | Revisa las 3 variables del Paso 4.1 (nombres en MAYÚSCULAS) |
| `terraform fmt -check` falla | El código de Terraform no está bien acomodado | Corre `terraform fmt -recursive` en tu compu y haz commit |
| `npm ci` dice que `package.json` y `package-lock.json` "are not in sync" | Cambiaste `package.json` sin actualizar el lockfile | Corre `npm install` y sube `package-lock.json` |
| El tablero dice "No pudimos cargar los datos" | Todavía no existe `sismos.json` | Espera a que termine el job **3 · Actualizar datos** o córrelo con *Run workflow* |
| 🪟 `"terraform" no se reconoce como un comando interno o externo` (o lo mismo con `aws`, `gh`, `node`) | Windows aún no "ve" el programa recién instalado | Cierra y vuelve a abrir la terminal. Si sigue igual, reinstálalo o reinicia la compu |
| 🪟 PowerShell dice `la ejecución de scripts está deshabilitada` al usar `npm` | PowerShell bloquea scripts por seguridad | Usa **CMD**, o en PowerShell corre una vez: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| `Permission denied` o `Authentication failed` al hacer `git push` | Git no tiene tu sesión de GitHub | Corre `gh auth login` (Paso 0) |
| `Author identity unknown` al hacer commit | Git no sabe quién eres | Corre los `git config --global user.name/user.email` del Paso 0 |
| `npm run dev` muestra error al cargar datos | No has descargado datos en tu compu | Corre `npm run datos` |
| El cron no corre | GitHub apaga los cron en repos sin actividad por 60 días, o tarda unos minutos | Haz un commit o córrelo manual |

---

## 💰 ¿Cuánto cuesta?

Con la **capa gratuita** de AWS, esta práctica debería costar **$0**:

| Servicio | Lo que usamos | Gratis al mes |
|---|---|---|
| S3 | Un archivo de unos KB | 5 GB |
| CloudFront | Unos MB de tráfico + ~720 limpiezas de caché | 1 TB + 1,000 limpiezas |
| Amplify | Un sitio pequeño | 15 GB servidos |
| GitHub Actions | ~2 min por hora | Ilimitado en repos públicos |

> ⚠️ No pongas el cron más seguido que cada hora: pasarías las 1,000 limpiezas
> de caché gratis de CloudFront al mes.

---

## 🏆 Retos (para subir de nivel)

1. 🎨 **Fácil:** agrega una tarjeta nueva: "Sismo más profundo" o "Estado más activo".
2. 🔔 **Fácil:** en la tabla, marca con 🔴 los sismos de magnitud 5 o más.
3. 📊 **Medio:** agrega una gráfica de **sismos por hora del día**. Pista: calcúlala en `calcularEstadisticas()` y escribe una prueba nueva.
4. 🌎 **Medio:** agrega una segunda fuente de datos: los sismos de **USGS**
   (`https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson`) para ver los fuertes del mundo.
5. 🧪 **Difícil:** agrega un ambiente de **pruebas** (`staging`): una segunda rama de Amplify donde se publique cada Pull Request antes del merge.
6. 🛡️ **Difícil:** agrega al pipeline un escáner de seguridad de Terraform (por ejemplo **Trivy** o **Checkov**) que falle si encuentra algo inseguro.

---

## 📖 Mini glosario

| Palabra | En corto |
|---|---|
| **CI** (Integración Continua) | Revisar y probar el código automáticamente en cada cambio |
| **CD** (Despliegue Continuo) | Publicar automáticamente cuando todo está bien |
| **ETL** | Extraer, Transformar y Cargar datos |
| **IaC** | Infraestructura como Código: crear servidores y servicios escribiendo archivos |
| **Estado de Terraform** | La "memoria" donde Terraform anota lo que ya creó |
| **OIDC** | Forma de que AWS confíe en GitHub sin guardar contraseñas |
| **CDN** | Red de servidores por todo el mundo que entrega archivos rápido (CloudFront) |
| **Caché / invalidación** | Copia guardada para responder rápido / borrar esa copia para que se actualice |
| **Cron** | Programar una tarea para que corra sola cada cierto tiempo |
| **Mínimo privilegio** | Dar solo los permisos necesarios, nada más |
