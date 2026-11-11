# 🛰️ Centinela: monitoreo sísmico de México

Tablero web que muestra **en tiempo casi real** los sismos que registra el
**Servicio Sismológico Nacional (SSN) de la UNAM**: mapa, indicadores y gráficas.

Es la práctica del curso de **Cloud y DevOps**. Usa las 4 herramientas que vimos en clase:

| Herramienta | ¿Qué hace en este proyecto? |
|---|---|
| **GitHub Actions** | El robot: revisa el código (CI), crea la infraestructura, publica el tablero (CD) y **cada hora** descarga sismos nuevos. |
| **Terraform** | Crea toda la infraestructura en AWS con código: S3, CloudFront y Amplify. |
| **Amazon CloudFront** | Reparte el archivo de datos `sismos.json` rápido, con HTTPS y caché. |
| **AWS Amplify** | Hospeda el tablero hecho en React. |

> 💡 **No necesitas comprar un dominio.** AWS te da gratis una URL con HTTPS
> como `https://main.d1abc2xyz.amplifyapp.com`.

---

## ¿Cómo funciona?

```
                    ┌───────────── GitHub Actions (cada hora) ─────────────┐
 SSN (UNAM)  ──▶    │ 1. EXTRAER     descarga los últimos sismos (RSS)     │
 ultimos-sismos.xml │ 2. TRANSFORMAR limpia datos y calcula estadísticas   │
                    │ 3. CARGAR      sube sismos.json a S3                 │
                    └──────────────────────────┬───────────────────────────┘
                                               ▼
                                  S3 (privado) ──▶ CloudFront ──▶ sismos.json
                                                                     │
  Tú, en el navegador  ◀──  Amplify (tablero en React)  ◀────────────┘
```

Como el RSS del SSN solo trae los ~15 sismos más recientes, cada hora el
pipeline **junta los nuevos con los que ya tenía**. Así el historial va
creciendo hasta 30 días. El primer día verás pocos sismos, ¡y se irá llenando!

## Estructura del proyecto

```
centinela-sismos/
├── src/                        # El tablero en React
│   ├── App.jsx                 #   página principal
│   └── components/             #   mapa, gráficas, tabla, indicadores
├── scripts/
│   ├── sismos.mjs              # Pipeline de datos (ETL)
│   └── sismos.test.mjs         # Pruebas del pipeline
├── infra/                      # Terraform: la infraestructura del proyecto
│   ├── backend.tf              #   dónde se guarda el estado
│   ├── main.tf                 #   S3 + CloudFront + Amplify
│   ├── variables.tf
│   └── outputs.tf
├── bootstrap/                  # Terraform que se corre UNA vez (permisos y estado)
├── .github/workflows/
│   └── pipeline.yml            # El robot de CI/CD
├── INSTALACION.md              # 🧰 Cómo instalar los programas necesarios
├── GUIA.md                     # 👉 Paso a paso para replicar la práctica
└── package.json
```

## Probarlo en tu computadora

Necesitas [Node.js](https://nodejs.org) **LTS más reciente** (mínimo v24; ya trae npm).

```bash
npm ci              # instala las dependencias (versiones exactas y revisadas)
npm run datos       # descarga sismos reales → public/sismos.json
npm run dev         # abre http://localhost:5173
```

Otros comandos:

| Comando | ¿Qué hace? |
|---|---|
| `npm run lint` | Revisa el estilo del código |
| `npm test` | Corre las pruebas del pipeline de datos |
| `npm run build` | Compila el tablero en la carpeta `dist/` |
| `npm run permisos` | Revisa si tu usuario de AWS puede crear todo (sin crear nada) |

## Publicarlo en AWS

1. Instala los programas: **[INSTALACION.md](INSTALACION.md)** 🧰
2. Sigue la **[GUIA.md](GUIA.md)**, paso a paso 🚀

---

Datos: Servicio Sismológico Nacional (SSN), Instituto de Geofísica, UNAM.
Proyecto educativo: **no es un sistema de alerta sísmica oficial**.
