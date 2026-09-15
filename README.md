# Lili Sincronia

Prototipo de coordinacion quirurgica de Principal y Limonar.

## Arquitectura

- `src/index.html`: estructura de la interfaz.
- `src/styles/`: estilos base e identidad visual.
- `src/data/`: catalogos y regularidades editables, sin casos de pacientes.
- `src/scheduler.js`: calculo de inicio, fin y recambio.
- `src/app.js`: formularios y visualizacion.
- `public/assets/`: identidad institucional.
- `scripts/`: construccion y sincronizacion manual del codigo.
- `.github/workflows/pages.yml`: publicacion con cada push a main.

## Desarrollo

Requiere Node.js 22 o posterior. Ejecutar `npm run build` y abrir `dist/index.html`.
Editar los archivos en src, no dist ni la version historica outputs.

## GitHub y Pages

Crear un repositorio en la cuenta elegida, conectar origin y enviar la rama main.
En Settings > Pages seleccionar GitHub Actions como fuente.
Cada push a main reconstruye y publica el sitio. La URL real aparecera en el despliegue.
`npm run sync` verifica, crea un commit y envia solo los directorios del proyecto autorizados.
No es un vigilante permanente: los archivos guardados localmente no se suben por si solos.

## Datos y limites

GitHub Pages sirve archivos estaticos; no proporciona base de datos ni autenticacion clinica.
Los casos del prototipo viven en memoria y se pierden al recargar. No ingresar datos reales.
Los cambios realizados en formularios no son commits y no se envian a GitHub.
Una version multiusuario con persistencia requiere API, base de datos y acceso autenticado.
Los catalogos de especialistas incluidos seran visibles en una publicacion publica.
La asignacion actual es un prototipo; los objetivos de urgencia no constituyen garantias operativas.
