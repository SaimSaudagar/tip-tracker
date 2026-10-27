# Store listing in Spanish

Spanish versions of the fields in `store-listing.md`, written for Spanish-speaking servers and bartenders in the US. Character counts were checked against each store’s limits.

The app itself switches to Spanish when the phone is set to Spanish, or from Settings → Language. Employer and year-end PDFs, CSV columns and the privacy policy and terms stay in English (the app says so on those screens).

**Support URL** for the Spanish (Mexico) localization in App Store Connect, which takes one per language: `https://<your-site>/support-es.html` (built by `npm run site`), and `https://<your-site>/es.html` as its Marketing URL. Google Play has one website link for every language, so keep the English page there; it links to the Spanish one.

**Where to add it:**
- **App Store Connect:** add the localization **Spanish (Mexico)**. Apple shows it on the US App Store to people whose phone is in Spanish.
- **Google Play Console:** add the translation **Spanish (United States) – es-US**.

---

## Apple App Store

| Field | Limit | Draft |
|---|---|---|
| Name | 30 | `Tipbook: Registro de Propinas` (29) |
| Subtitle | 30 | `Sin anuncios. Tu pago por hora` (30) |
| Keywords | 100 | `mesero,mesera,bartender,cantinero,turno,salario,ingresos,reparto,informe,irs,impuestos,restaurante` (98) |

Apple already indexes the words in the name and subtitle, so the keywords don’t repeat them.

**Promotional text** (170 max):

> Registra tus propinas en 5 segundos. Sin anuncios ni cuenta. Pago real por hora, reparto de propinas e informes para tu empleador y los impuestos.

**Description:**

> Descubre lo que de verdad ganas.
>
> Tipbook es la app para llevar el registro de tus propinas, hecha para meseros, bartenders y todos los que ganan propinas. Registra un turno en unos cinco segundos y ve tu pago real por hora: salario más propinas, dividido entre las horas que de verdad trabajaste.
>
> SIN ANUNCIOS. NUNCA.
> Nada de ventanas emergentes mientras anotas tus propinas. Sin cuenta que perder. Tus propinas se quedan en tu teléfono y se incluyen en sus copias de seguridad normales.
>
> REGISTRA UN TURNO EN SEGUNDOS
> • Propinas en efectivo, con tarjeta y horas
> • Reparto de propinas a ayudantes, barra y anfitriones, y propinas que te dan tus compañeros
> • Cargos por servicio y propinas automáticas, separados de las propinas
> • Ventas y notas cuando las quieras
>
> VE TU DINERO
> • Esta semana, este mes y tu pago real por hora de un vistazo
> • Un calendario con lo que ganaste cada día
> • Todos tus trabajos y puestos, cada uno con su salario
>
> ESCANEA TU TICKET DE CIERRE
> Toma una foto del ticket al final del turno y Tipbook lee los totales por ti, en tu propio teléfono.
>
> SIEMPRE A UN TOQUE
> • Un widget para la pantalla de inicio y la pantalla bloqueada con las propinas de la semana
> • Tus horas extra calculadas con la tarifa de tu talón de pago
>
> CÁMBIATE EN UN MINUTO
> Importa tu historial de otra app de propinas o de una hoja de cálculo (CSV). Exporta todo cuando quieras.
>
> TIPBOOK PRO
> • Informe mensual de propinas para tu empleador, con un recordatorio antes del día 10
> • Resumen de propinas de fin de año para los impuestos, con los cargos por servicio aparte
> • Reparto de propinas automático (% de las propinas, % de las ventas o una cantidad fija)
> • Trabajos y puestos ilimitados
> • Tu año completo de un vistazo
>
> Pro está disponible como suscripción anual con 14 días de prueba gratis, como suscripción mensual o como compra única de por vida. Las suscripciones se renuevan automáticamente a menos que se cancelen al menos 24 horas antes de que termine el periodo. Adminístralas en los ajustes de tu Apple ID.
>
> Solo registros, no asesoría de impuestos. Los informes en PDF y los términos están en inglés.
>
> Términos de uso: [hosted terms URL]
> Política de privacidad: [hosted privacy URL]

The English description mentions “Hey Siri, log my tips in Tipbook”. The Siri phrases only work in English for now, so the Spanish description leaves that line out.

**Screenshots:** `docs/store-screenshots/es/` has the same six screens, sizes and layout as the English set, captured from the app in Spanish:

1. **Sin anuncios. Nunca.** Registra un turno en unos 5 segundos.
2. **Tu pago real por hora,** no solo tus propinas.
3. **Cada día de un vistazo.** Ve cuánto pagó cada turno.
4. **Tu informe de propinas,** listo antes del día 10.
5. **Cámbiate en un minuto.** Trae tu historial contigo.
6. **Tus mejores turnos.** Mejores días, almuerzo o cena, tendencias.

---

## Google Play

| Field | Limit | Draft |
|---|---|---|
| App name | 30 | `Tipbook: Registro de Propinas` (29) |
| Short description | 80 | `Anota tus propinas en 5 segundos. Pago real por hora e informes. Sin anuncios.` (78) |

**Full description:** reuse the App Store description above, but replace “los ajustes de tu Apple ID” with “tus suscripciones de Google Play”, and “la pantalla de inicio y la pantalla bloqueada” with “la pantalla de inicio”.
