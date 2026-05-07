export const developersMessages = {
  en: {
    "developers.title": "Developers",
    "developers.seoTitle": "Coptic Compass Public APIs for Developers",
    "developers.description":
      "Explore the public Coptic Compass grammar and dictionary APIs plus Shenute AI and OCR-backed image integration patterns for developer workflows.",
    "developers.heroTitle": "Build on Coptic Compass public APIs",
    "developers.heroDescription":
      "The public API surface includes the read-only grammar dataset, normalized dictionary search, Shenute AI provider routing, and an OCR proxy for image or document uploads.",
    "developers.primaryCta": "Open API Docs",
    "developers.secondaryCta": "View OpenAPI JSON",
    "developers.discoveryTitle": "Start here",
    "developers.discoveryDescription":
      "Most integrations should begin with the OpenAPI document, which describes the available public services and their request shapes.",
    "developers.workflowTitle": "Typical workflow",
    "developers.workflow.0":
      "Use /api/openapi.json to inspect contracts for all four public services.",
    "developers.workflow.1":
      "Call /api/v1/grammar to discover grammar endpoints and dataset version.",
    "developers.workflow.2":
      "Fetch /api/v1/grammar/lessons for the published lesson index.",
    "developers.workflow.3":
      "Query /api/v1/dictionary/search for paginated dictionary results.",
    "developers.workflow.4":
      "Use /api/v1/dictionary/search-index when a reduced full dictionary index is needed.",
    "developers.workflow.5":
      "Send POST /api/shenute requests for Shenute AI responses (default provider: thoth).",
    "developers.workflow.6":
      "Send image OCR requests to POST /api/ocr so Coptic Compass forwards them to OCR_SERVICE_URL.",
    "developers.integrationTitle": "Integration notes",
    "developers.integration.0":
      "Grammar responses are read-only and versioned with schemaVersion, datasetVersion, and generatedAt metadata.",
    "developers.integration.1":
      "The public dataset only exposes published lessons and their related concepts, examples, exercises, footnotes, and sources.",
    "developers.integration.2":
      "The lesson filter accepts either a lesson slug or a canonical lesson id.",
    "developers.integration.3":
      "Dictionary search accepts q, dialect, partOfSpeech, exact, limit, and offset filters.",
    "developers.integration.4":
      "Dictionary payloads are normalized and do not include raw/source-only fields.",
    "developers.integration.5":
      "For browser apps on another origin, a backend proxy is the safest default.",
    "developers.integration.6":
      "Shenute AI supports provider values: thoth, openrouter, gemini, and hf.",
    "developers.integration.7":
      "Image upload and camera capture flows run OCR first and append extracted text under [Image OCR Context] before calling /api/shenute.",
    "developers.integration.8":
      "Set OCR_SERVICE_URL and optionally OCR_UPLOAD_FIELD when your OCR backend requires a specific multipart field name.",
    "developers.integration.9":
      "The /api/ocr endpoint proxies multipart OCR uploads and returns upstream OCR responses to the client.",
    "developers.endpointsTitle": "High-value endpoints",
    "developers.exampleTitle": "Example request",
    "developers.exampleCaption":
      "A minimal server-side fetch that lists published lesson titles.",
    "developers.dictionaryExampleTitle": "Dictionary search example",
    "developers.dictionaryExampleCaption":
      "A paginated dictionary search request scoped to the Bohairic dialect.",
    "developers.resourcesTitle": "Related resources",
    "developers.breadcrumbLabel": "Developers",
    "developers.shenuteExampleTitle": "Shenute AI request example",
    "developers.shenuteExampleCaption":
      "A minimal POST request to /api/shenute using THOTH AI as provider.",
    "developers.ocrExampleTitle": "OCR integration notes",
    "developers.ocrExampleCaption":
      "Clients can call /api/ocr, and Coptic Compass forwards to OCR_SERVICE_URL then returns the upstream OCR response.",
    "developers.endpoints.grammar.desc":
      "Discovery index for the public grammar API.",
    "developers.endpoints.lessons.desc":
      "Published lesson index for public integrations.",
    "developers.endpoints.manifest.desc":
      "Manifest with dataset-level metadata and counts.",
    "developers.endpoints.openapi.desc": "Machine-readable OpenAPI document.",
    "developers.endpoints.dictionarySearch.desc":
      "Paginated normalized dictionary search with query, dialect, part-of-speech, exact-match, and pagination filters.",
    "developers.endpoints.dictionaryIndex.desc":
      "Reduced dictionary index for client search and analytics drilldowns.",
    "developers.endpoints.shenute.desc":
      "Shenute AI endpoint with provider routing and fallback handling.",
    "developers.endpoints.ocr.desc":
      "OCR proxy endpoint that forwards image uploads to OCR_SERVICE_URL.",
    "developers.resources.swagger.label": "Swagger UI",
    "developers.resources.swagger.desc":
      "Interactive reference for exploring every endpoint.",
    "developers.resources.openapi.label": "OpenAPI JSON",
    "developers.resources.openapi.desc":
      "Import into Postman, SDK generators, or internal tooling.",
    "developers.resources.apiIndex.label": "Grammar API index",
    "developers.resources.apiIndex.desc":
      "Read grammar dataset capabilities and example grammar routes.",
    "developers.resources.dictionary.label": "Dictionary search API",
    "developers.resources.dictionary.desc":
      "Search normalized Coptic dictionary entries by Coptic, English, Dutch, Greek, dialect, and part of speech.",
    "developers.resources.grammarHub.label": "Grammar hub",
    "developers.resources.grammarHub.desc":
      "See the public content the API is exposing.",
    "developers.resources.shenute.label": "Shenute AI",
    "developers.resources.shenute.desc":
      "Reference UI for provider selection plus OCR-backed image and camera messaging.",
    "developers.resources.ocr.label": "OCR proxy endpoint",
    "developers.resources.ocr.desc":
      "Send multipart OCR requests without exposing your upstream OCR service URL.",
  },
  nl: {
    "developers.title": "Ontwikkelaars",
    "developers.seoTitle": "Coptic Compass publieke API's voor ontwikkelaars",
    "developers.description":
      "Verken de publieke grammatica- en woordenboek-API's van Coptic Compass, plus Shenute AI en OCR-ondersteunde afbeeldingsintegratie voor ontwikkelaars.",
    "developers.heroTitle":
      "Bouw voort op de publieke API's van Coptic Compass",
    "developers.heroDescription":
      "De publieke API-laag omvat de alleen-lezen grammaticadataset, genormaliseerde woordenboekzoekfunctie, Shenute AI-providerroutering en een OCR-proxy voor afbeelding- of documentuploads.",
    "developers.primaryCta": "Open API-docs",
    "developers.secondaryCta": "Bekijk OpenAPI JSON",
    "developers.discoveryTitle": "Begin hier",
    "developers.discoveryDescription":
      "De meeste integraties starten best bij het OpenAPI-document, waar de publieke services en requestvormen worden beschreven.",
    "developers.workflowTitle": "Typische workflow",
    "developers.workflow.0":
      "Gebruik /api/openapi.json om de contracten voor alle vier publieke services te bekijken.",
    "developers.workflow.1":
      "Roep /api/v1/grammar aan om grammatica-endpoints en datasetversie te ontdekken.",
    "developers.workflow.2":
      "Gebruik /api/v1/grammar/lessons voor de index van gepubliceerde lessen.",
    "developers.workflow.3":
      "Query /api/v1/dictionary/search voor gepagineerde woordenboekresultaten.",
    "developers.workflow.4":
      "Gebruik /api/v1/dictionary/search-index wanneer een beperkte volledige woordenboekindex nodig is.",
    "developers.workflow.5":
      "Verstuur POST /api/shenute voor Shenute AI-antwoorden (standaardprovider: thoth).",
    "developers.workflow.6":
      "Stuur OCR-requests voor afbeeldingen naar POST /api/ocr zodat Coptic Compass ze doorstuurt naar OCR_SERVICE_URL.",
    "developers.integrationTitle": "Integratienotities",
    "developers.integration.0":
      "Grammaticaresponses zijn alleen-lezen en bevatten schemaVersion, datasetVersion en generatedAt.",
    "developers.integration.1":
      "De publieke dataset bevat alleen gepubliceerde lessen en de bijbehorende begrippen, voorbeelden, oefeningen, voetnoten en bronnen.",
    "developers.integration.2":
      "De lesson-filter accepteert zowel een slug als een canonieke les-id.",
    "developers.integration.3":
      "Woordenboekzoekopdrachten accepteren q, dialect, partOfSpeech, exact, limit en offset als filters.",
    "developers.integration.4":
      "Woordenboekpayloads zijn genormaliseerd en bevatten geen ruwe of alleen-bronvelden.",
    "developers.integration.5":
      "Voor browser-apps op een andere origin is een backendproxy de veiligste standaardoptie.",
    "developers.integration.6":
      "Shenute AI ondersteunt providers: thoth, openrouter, gemini en hf.",
    "developers.integration.7":
      "Bij upload van afbeeldingen of cameracaptures draait OCR eerst; de geëxtraheerde tekst wordt toegevoegd onder [Image OCR Context] vóór de call naar /api/shenute.",
    "developers.integration.8":
      "Stel OCR_SERVICE_URL in en optioneel OCR_UPLOAD_FIELD als uw OCR-backend een vaste multipart-veldnaam vereist.",
    "developers.integration.9":
      "Het endpoint /api/ocr proxyt multipart OCR-uploads en geeft het upstream OCR-resultaat terug aan de client.",
    "developers.endpointsTitle": "Belangrijke endpoints",
    "developers.exampleTitle": "Voorbeeldrequest",
    "developers.exampleCaption":
      "Een minimale server-side fetch-aanroep die de titels van gepubliceerde lessen ophaalt.",
    "developers.dictionaryExampleTitle": "Voorbeeld woordenboekzoekopdracht",
    "developers.dictionaryExampleCaption":
      "Een gepagineerde woordenboekzoekopdracht beperkt tot het Bohairisch.",
    "developers.resourcesTitle": "Verwante bronnen",
    "developers.breadcrumbLabel": "Ontwikkelaars",
    "developers.shenuteExampleTitle": "Voorbeeld Shenute AI-request",
    "developers.shenuteExampleCaption":
      "Een minimale POST-request naar /api/shenute met THOTH AI als provider.",
    "developers.ocrExampleTitle": "OCR-integratienotities",
    "developers.ocrExampleCaption":
      "Clients kunnen /api/ocr aanroepen; Coptic Compass stuurt door naar OCR_SERVICE_URL en geeft de upstream OCR-response terug.",
    "developers.endpoints.grammar.desc":
      "Ontdekkingsindex voor de publieke grammatica-API.",
    "developers.endpoints.lessons.desc":
      "Index van gepubliceerde lessen voor publieke integraties.",
    "developers.endpoints.manifest.desc":
      "Manifest met datasetmetadata en aantallen.",
    "developers.endpoints.openapi.desc": "Machineleesbaar OpenAPI-document.",
    "developers.endpoints.dictionarySearch.desc":
      "Gepagineerde genormaliseerde woordenboekzoekfunctie met query-, dialect-, woordsoort-, exact-match- en pagineringsfilters.",
    "developers.endpoints.dictionaryIndex.desc":
      "Beperkte woordenboekindex voor clientzoekfunctie en analytische drilldowns.",
    "developers.endpoints.shenute.desc":
      "Shenute AI-endpoint met providerkeuze en fallback-afhandeling.",
    "developers.endpoints.ocr.desc":
      "OCR-proxyendpoint dat afbeelding-uploads doorstuurt naar OCR_SERVICE_URL.",
    "developers.resources.swagger.label": "Swagger UI",
    "developers.resources.swagger.desc":
      "Interactieve referentie om alle endpoints te verkennen.",
    "developers.resources.openapi.label": "OpenAPI JSON",
    "developers.resources.openapi.desc":
      "Importeer in Postman, SDK-generators of interne tooling.",
    "developers.resources.apiIndex.label": "Grammatica-API-index",
    "developers.resources.apiIndex.desc":
      "Lees de mogelijkheden van de grammaticadataset en voorbeeldroutes voor grammatica.",
    "developers.resources.dictionary.label": "Woordenboekzoek-API",
    "developers.resources.dictionary.desc":
      "Zoek genormaliseerde Koptische woordenboeklemma's op Koptisch, Engels, Nederlands, Grieks, dialect en woordsoort.",
    "developers.resources.grammarHub.label": "Grammatica-overzicht",
    "developers.resources.grammarHub.desc":
      "Bekijk de publieke inhoud die de API ontsluit.",
    "developers.resources.shenute.label": "Shenute AI",
    "developers.resources.shenute.desc":
      "Referentie-UI met providerkeuze en OCR-ondersteunde afbeeldings- en cameraberichten.",
    "developers.resources.ocr.label": "OCR-proxyendpoint",
    "developers.resources.ocr.desc":
      "Verstuur multipart OCR-requests zonder uw upstream OCR-service-URL te publiceren.",
  },
} as const;
