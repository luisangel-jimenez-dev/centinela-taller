// ============================================================
//  ¿Tengo permisos para crear Centinela en AWS?
//
//  Revisa tu usuario SIN CREAR NADA (solo le pregunta a AWS).
//  Funciona igual en Windows (CMD o PowerShell), Mac y Linux.
//
//  Uso:  npm run permisos
// ============================================================

import { execFileSync } from 'node:child_process'

// Corre un comando de AWS CLI y regresa su respuesta en JSON.
function aws(...argumentos) {
  const salida = execFileSync('aws', [...argumentos, '--output', 'json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32', // en Windows, "aws" es aws.cmd o aws.exe
  })
  return JSON.parse(salida)
}

// Saca el mensaje de error de AWS (o uno genérico).
function mensajeDeError(error) {
  return (error.stderr || error.message || '').toString().trim()
}

// Lo que Centinela necesita hacer en AWS
const ACCIONES = [
  // Bootstrap: bucket del estado, OIDC y rol para GitHub
  's3:CreateBucket', 's3:PutBucketVersioning', 's3:PutBucketPublicAccessBlock',
  's3:PutBucketPolicy', 's3:PutObject', 's3:GetObject',
  'iam:CreateOpenIDConnectProvider', 'iam:CreateRole', 'iam:PutRolePolicy', 'iam:GetRole',
  // Proyecto: CloudFront y Amplify
  'cloudfront:CreateDistribution', 'cloudfront:CreateOriginAccessControl',
  'cloudfront:CreateInvalidation', 'cloudfront:ListCachePolicies',
  'amplify:CreateApp', 'amplify:CreateBranch', 'amplify:CreateDeployment', 'amplify:StartDeployment',
]

// ------------------------------------------------------------
// 1. ¿Quién soy?
// ------------------------------------------------------------
console.log('🔎 1. ¿Quién soy en AWS?')
let identidad
try {
  identidad = aws('sts', 'get-caller-identity')
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('❌ No encontré el comando "aws". Instala AWS CLI v2 (ver GUIA.md, Paso 0).')
  } else {
    console.log('❌ No pude conectarme a AWS:')
    console.log(`   ${mensajeDeError(error)}`)
    console.log('\n   Revisa el Paso 2 de la GUIA.md (aws login o aws configure).')
    console.log("   Si dice 'InvalidClientTokenId', tus llaves de acceso ya no sirven: crea unas nuevas.")
  }
  process.exit(1)
}

let arn = identidad.Arn
console.log(`   Cuenta: ${identidad.Account}`)
console.log(`   Usuario/rol: ${arn}\n`)

// El usuario raíz puede todo (pero no se recomienda usarlo)
if (arn.endsWith(':root')) {
  console.log('⚠️  Estás usando el usuario RAÍZ: tienes todos los permisos,')
  console.log('   pero es mejor crear un usuario administrador (ver GUIA.md, Paso 2).')
  process.exit(0)
}

// Si es un rol (SSO, AWS Academy, etc.), buscamos el ARN real del rol
if (arn.includes(':assumed-role/')) {
  const nombreRol = arn.split('/')[1]
  try {
    arn = aws('iam', 'get-role', '--role-name', nombreRol).Role.Arn
  } catch {
    // si no podemos leer el rol, seguimos con el ARN que tenemos
  }
}

// ------------------------------------------------------------
// 2. ¿Puedo hacer lo que Centinela necesita?
// ------------------------------------------------------------
console.log('🔎 2. ¿Puedo hacer lo que Centinela necesita?')
let resultados
try {
  resultados = aws(
    'iam', 'simulate-principal-policy',
    '--policy-source-arn', arn,
    '--action-names', ...ACCIONES,
  ).EvaluationResults
} catch (error) {
  console.log('⚠️  No pude revisar los permisos automáticamente:')
  console.log(`   ${mensajeDeError(error)}\n`)
  console.log("   Probablemente tu usuario no tiene permiso de 'simular'. Pregúntale al")
  console.log('   administrador de la cuenta si tienes AdministratorAccess, o haz la prueba')
  console.log("   real con 'terraform plan' + 'terraform apply' en la carpeta bootstrap.")
  process.exit(1)
}

let faltan = 0
for (const { EvalActionName, EvalDecision } of resultados) {
  if (EvalDecision === 'allowed') {
    console.log(`   ✅ ${EvalActionName}`)
  } else {
    console.log(`   ❌ ${EvalActionName}  (${EvalDecision})`)
    faltan++
  }
}

console.log()
if (faltan === 0) {
  console.log('🎉 ¡Tienes todos los permisos! Puedes seguir con el Paso 3 de la GUIA.md.')
  console.log('   (Nota: si tu cuenta es de una organización o de AWS Academy, puede haber')
  console.log("    reglas extra (SCP) que esta prueba no ve. Si 'apply' falla, avísale a tu profe.)")
} else {
  console.log(`🚫 Te faltan ${faltan} permisos. Pide que te den 'AdministratorAccess'`)
  console.log('   o al menos los permisos marcados con ❌.')
  process.exit(1)
}
