

import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ProductDetails, GeneratedContent, FormFieldConfig, Testimonial, UiTranslation } from "../types";

const apiKey = process.env.API_KEY;

// Initialize AI only if key is present
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

interface LanguageConfig {
    currency: string;
    locale: string;
    countryContext: string;
    verifiedRole: string;
    announcement: string;
    ctaSubtext: string;
    formLabels: Record<string, string>;
    ui: UiTranslation;
}

const DISCLAIMER_BASE = "Il nostro sito web agisce esclusivamente come affiliato e si concentra sulla promozione dei prodotti tramite campagne pubblicitarie. Non ci assumiamo alcuna responsabilità per la spedizione, la qualità o qualsiasi altra questione riguardante i prodotti venduti tramite link di affiliazione. Ti preghiamo di notare che le immagini utilizzate a scopo illustrativo potrebbero non corrispondere alla reale immagine del prodotto acquistato. Ti invitiamo a contattare il servizio assistenza clienti dopo aver inserito i dati nel modulo per chiedere qualsiasi domanda o informazione sul prodotto prima di confermare l’ordine. Ti informiamo inoltre che i prodotti in omaggio proposti sul sito possono essere soggetti a disponibilità limitata, senza alcuna garanzia di disponibilità da parte del venditore che spedisce il prodotto. Ricorda che, qualora sorgessero problemi relativi alle spedizioni o alla qualità dei prodotti, la responsabilità ricade direttamente sull’azienda fornitrice.";

// Helper for translations
const getLegalTranslation = (lang: string): string => {
    const translations: Record<string, string> = {
        'Italiano': DISCLAIMER_BASE,
        'Inglese': "Our website acts exclusively as an affiliate and focuses on promoting products through advertising campaigns. We assume no responsibility for shipping, quality, or any other issue regarding products sold through affiliate links. Please note that images used for illustrative purposes may not correspond to the actual product image purchased. We invite you to contact customer service after entering your data in the form to ask any questions or information about the product before confirming the order. We also inform you that free products offered on the site may be subject to limited availability, without any guarantee of availability from the seller shipping the product. Remember that should problems arise regarding shipments or product quality, the responsibility lies directly with the supplying company.",
        'Francese': "Notre site Web agit exclusivement en tant qu'affilié et se concentre sur la promotion de produits via des campagnes publicitaires. Nous n'assumons aucune responsabilité quant à l'expédition, la qualité ou toute autre question concernant les produits vendus via des liens d'affiliation. Veuillez noter que les images utilisées à des fins d'illustration peuvent ne pas correspondre à l'image réelle du produit acheté. Nous vous invitons à contacter le service client après avoir saisi vos données dans le formulaire pour poser toute question ou information sur le produit avant de confirmer la commande. Nous vous informons également que les produits gratuits proposés sur le site peuvent être soumis à une disponibilité limitée, sans aucune garantie de disponibilité de la part du vendeur expédiant le produit. N'oubliez pas qu'en cas de problèmes concernant les expéditions ou la qualité des produits, la responsabilité incombe directement à l'entreprise fournisseuse.",
        'Tedesco': "Unsere Website fungiert ausschließlich als Partner und konzentriert sich auf die Bewerbung von Produkten durch Werbekampagnen. Wir übernehmen keine Verantwortung für Versand, Qualität oder andere Fragen bezüglich der über Partnerlinks verkauften Produkte. Bitte beachten Sie, dass die zu Illustrationszwecken verwendeten Bilder möglicherweise nicht dem tatsächlichen Bild des gekauften Produkts entsprechen. Wir laden Sie ein, den Kundendienst zu kontaktieren, nachdem Sie Ihre Daten in das Formular eingegeben haben, um Fragen oder Informationen zum Produkt zu stellen, bevor Sie die Bestellung bestätigen. Wir informieren Sie auch darüber, dass die auf der Website angebotenen kostenlosen Produkte einer begrenzten Verfügbarkeit unterliegen können, ohne dass der Verkäufer, der das Produkt versendet, eine Verfügbarkeitsgarantie übernimmt. Denken Sie daran, dass bei Problemen mit Sendungen oder der Produktqualität die Verantwortung direkt beim liefernden Unternehmen liegt.",
        'Spagnolo': "Nuestro sitio web actúa exclusivamente como afiliado y se centra en la promoción de productos a través de campañas publicitarias. No asumimos ninguna responsabilidad por el envío, la calidad o cualquier otra cuestión relacionada con los productos vendidos a través de enlaces de afiliados. Tenga en cuenta que las imágenes utilizadas con fines ilustrativos pueden no corresponder a la imagen real del producto comprado. Le invitamos a ponerse en contacto con el servicio de atención al cliente después de introducir sus datos en el formulario para realizar cualquier pregunta o información sobre el producto antes de confirmar el pedido. También le informamos que los productos gratuitos ofrecidos en el sitio pueden estar sujetos a disponibilidad limitada, sin ninguna garantía de disponibilidad por parte del vendedor que envía el producto. Recuerde que si surgen problemas relacionados con los envíos o la calidad de los productos, la responsabilidad recae directamente en la empresa proveedora.",
        'Portoghese': "O nosso site atua exclusivamente como afiliado e concentra-se na promoção de produtos através de campanhas publicitarias. Não assumimos qualquer responsabilidade pelo envio, qualidade o qualquer outra questão relativa aos produtos vendidos através de links de afiliados. Tenha em atenção que as imagens utilizadas para fins ilustrativos podem não corresponder à imagem real do produto adquirido. Convidamo-lo a contactar o serviço de apoio ao cliente após introduzir os seus dados no formulário para fazer qualquer pergunta ou obter informações sobre o produto antes de confirmar a encomenda. Informamos também que os produtos gratuitos oferecidos no site podem estar sujeitos a disponibilidade limitada, sem qualquer garantia de disponibilidade por parte do vendedor que envia o produto. Lembre-se que, caso surjam problemas relacionados com envios ou qualidade dos produtos, a responsabilidade recai diretamente sobre a empresa fornecedora.",
        'Olandese': "Onze website fungeert uitsluitend als partner en richt zich op het promoten van producten via reclamecampagnes. Wij aanvaarden geen verantwoordelijkheid voor verzending, kwaliteit of enige andere kwestie met betrekking tot producten die via partnerlinks worden verkocht. Houd er rekening mee dat afbeeldingen die voor illustratieve doeleinden worden gebruikt, mogelijk niet overeenkomen met de daadwerkelijke afbeelding van het gekochte product. Wij nodigen u uit om contact op te nemen met de klantenservice nadat u uw gegevens in het formulier hebt ingevoerd om vragen te stellen of informatie over het product te vragen voordat u de bestelling bevestigt. Wij informeren u ook dat gratis producten die op de site worden aangeboden, onderhevig kunnen zijn aan beperkte beschikbaarheid, zonder enige garantie van beschikbaarheid van de verkoper die het product verzendt. Vergeet niet dat als er problemen ontstaan met betrekking tot zendingen of productkwaliteit, de verantwoordelijkheid rechtstreeks bij het leverende bedrijf ligt.",
        'Polacco': "Nasza strona internetowa działa wyłącznie jako partner i koncentruje się na promowaniu produktów poprzez kampanie reklamowe. Nie ponosimy żadnej odpowiedzialności za wysyłkę, jakość ani żadne inne kwestie dotyczące produktów sprzedawanych za pośrednictwem linków partnerskich. Należy pamiętać, że zdjęcia użyte w celach ilustracyjnych mogą nie odpowiadać rzeczywistemu wizerunkowi zakupionego produktu. Zapraszamy do kontaktu z obsługą klienta po wprowadzeniu danych w formularzu w celu zadania pytań lub uzyskania informacji o produkcie przed potwierdzeniem zamówienia. Informujemy również, że bezpłatne produkty oferowane na stronie mogą być objęte ograniczoną dostępnością, bez żadnej gwarancji dostępności ze strony sprzedawcy wysyłającego produkt. Pamiętaj, że w przypadku problemów związanych z przesyłkami lub jakością produktów odpowiedzialność spoczywa bezpośrednio na firmie dostarczającej.",
        'Rumeno': "Site-ul nostru acționează exclusiv ca afiliat și se concentrează pe promovarea produselor prin campanii publicitare. Nu ne asumăm nicio responsabilitate pentru transport, calitate sau orice altă problemă privind produsele vândute prin link-uri de afiliere. Vă rugăm să rețineți că imaginile utilizate în scop ilustrativ pot să nu corespundă cu imaginea reală a produsului achiziționat. Vă invităm să contactați serviciul de asistență clienți după introducerea datelor în formular pentru a pune orice întrebare sau informație despre produs înainte de a confirma comanda. Vă informăm, de asemenea, că produsele gratuite oferite pe site pot fi supuse unei disponibilități limitate, fără nicio garanție de disponibilitate din partea vânzătorului care expediază produsul. Rețineți că, în cazul în care apar probleme legate de expedieri sau de calitatea produselor, responsabilitatea revine direct companiei furnizoare.",
        'Svedese': "Vår webbplats fungerar uteslutande som en affiliate och fokuserar på att marknadsföra produkter genom reklamkampanjer. Vi tar inget ansvar för frakt, kvalitet eller någon annan fråga gällande produkter som säljs via affiliatelänkar. Observera att bilder som används i illustrativt syfte kanske inte motsvarar den faktiska bilden av den köpta produkten. Vi inbjuder dig att kontakta kundtjänst efter att ha angett dina uppgifter i formuläret för att ställa frågor eller få information om produkten innan du bekräftar beställningen. Vi informerar dig också om att gratisprodukter som erbjuds på webbplatsen kan vara föremål för begränsad tillgänglighet, utan någon garanti för tillgänglighet från säljaren som skickar produkten. Kom ihåg att om problem uppstår gällande leveranser eller produktkvalitet ligger ansvaret direkt på det levererande företaget.",
        'Bulgaro': "Нашият уебсайт действа изключително като партньор и се фокусира върху популяризирането на продукти чрез рекламни кампании. Не поемаме отговорност за доставка, качество или какъвто и да е друг въпрос относно продукти, продавани чрез партньорски връзки. Моля, имайте предвид, че изображенията, използвани с илюстративна цел, може да не съответстват на действителното изображение на закупения продукт. Каним ви да се свържете с обслужването на клиенти, след като въведете данните си във формуляра, за да зададете всякакви въпроси или информация за продукта, преди да потвърдите поръчката. Също така ви информираме, че безплатните продукти, предлагани на сайта, може да са с ограничена наличност, без никаква гаранция за наличност от продавача, изпращащ продукта. Не забравяйте, че ако възникнат проблеми, свързани с пратките или качеството на продуктите, отговорността е директно на фирмата доставчик.",
        'Greco': "Ο ιστότοπός μας λειτουργεί αποκλειστικά ως συνεργάτης και επικεντρώνεται στην προώθηση προϊόντων μέσω διαφημιστικών εκστρατειών. Δεν αναλαμβάνουμε καμία ευθύνη για την αποστολή, την ποιότητα ή οποιοδήποτε άλλο ζήτηма σχετικά με προϊόντα που πωλούνται μέσω συνδέσμων συνεργατών. Λάβετε υπόψη ότι οι εικόνες που χρησιμοποιούνται για επεξηγηματικούς σκοπούς ενδέχεται να μην αντιστοιχούν στην πραγματική εικόνα του προϊόντος που αγοράσατε. Σας προσκαλούμε να επικοινωνήσετε με την εξυπηρέτηση πελατών αφού εισαγάγετε τα στοιχεία σας στη φόρμα για να κάνετε οποιεσδήποτε ερωτήσεις ή πληροφορίες σχετικά με το προϊόν πριν επιβεβαιώσετε την παραγγελία. Σας ενημερώνουμε επίσης ότι τα δωρεάν προϊόντα που προσφέρονται στον ιστότοπο ενδέχεται να υπόκεινται σε περιορισμένη διαθεσιμότητα, χωρίς καμία εγγύηση διαθεσιμότητας από τον πωλητή που αποστέλλει το προϊόν. Να θυμάστε ότι εάν προκύψουν προβλήματα σχετικά με τις αποστολές ή την ποιότητα των προϊόντων, η ευθύνη βαρύνει άμεσα την προμηθεύτρια εταιρεία.",
        'Ungherese': "Weboldalunk kizárólag partnerként működik, és a termékek reklámkampányokon keresztül történő népszerűsítésére összpontosít. Nem vállalunk felelősséget a szállításért, a minőségért vagy a partnerlinkeken keresztül értékesített termékekkel kapcsolatos bármely más kérdésért. Felhívjuk figyelmét, hogy az illusztrációs célokra használt képek nem feltétlenül felelnek meg a megvásárolt termék tényleges képének. Kérjük, vegye fel a kapcsolatot az ügyfélszolgálattal, miután megadta adatait az űrlapon, hogy bármilyen kérdést vagy információt feltegyen a termékkel kapcsolatban a megrendelés megerősítése előtt. Tájékoztatjuk továbbá, hogy az oldalon kínált ingyenes termékek korlátozottan állhatnak rendelkezésre, a terméket szállító eladó rendelkezésre állási garanciája nélkül. Ne feledje, hogy amennyiben a szállítással vagy a termékminőséggel kapcsolatban problémák merülnek fel, a felelősség közvetlenül a szállító céget terheli.",
        'Croato': "Naša web stranica djeluje isključivo kao partner i usredotočena je na promociju proizvoda putem reklamnih kampanja. Ne preuzimamo nikakvu odgovornost za otpremu, kvalitetu ili bilo koje drugo pitanje u vezi s proizvodima koji se prodaju putem partnerskih veza. Imajte na umu da slike koje se koriste u ilustrativne svrhe možda ne odgovaraju stvarnoj slici kupljenog proizvoda. Pozivamo vas da kontaktirate korisničku podršku nakon unosa podataka u obrazac kako biste postavili bilo kakva pitanja ili informacije o proizvodu prije potvrde narudžbe. Također vas obavještavamo da besplatni proizvodi ponuđeni na web mjestu mogu biti podložni ograničenoj dostupnosti, bez ikakvog jamstva dostupnosti od strane prodavatelja koji šalje proizvod. Imajte na umu da ako se pojave problemi u vezi s pošiljkama ili kvalitetom proizvoda, odgovornost leži izravno na tvrtki dobavljaču.",
        'Serbo': "Naša veb stranica deluje isključivo kao partner i fokusira se na promociju proizvoda putem reklamnih kampanja. Ne preuzimamo nikakvu odgovornost za otpremu, kvalitet ili bilo koje drugo pitanje u vezi sa proizvodima koji se prodaju putem partnerskih veza. Imajte na umu da slike koje se koriste u ilustrativne svrhe možda ne odgovaraju stvarnoj slici kupljenog proizvoda. Pozivamo vas da kontaktirate korisničku podršku nakon unosa podataka u obrazac kako biste postavili bilo kakva pitanja ili informacije o proizvodu pre potvrde porudžbine. Takođe vas obaveštavamo da besplatni proizvodi ponuđeni na sajtu mogu biti podložni ograničenoj dostupnosti, bez ikakve garancije dostupnosti od strane prodavca koji šalje proizvod. Imajte na umu da ako se pojave problemi u vezi sa pošiljkama ili kvalitetom proizvoda, odgovornost leži direktno na kompaniji dobavljaču.",
    };
    return translations[lang] || translations['Italiano'];
};

// --- UI TRANSLATIONS CONFIG ---
// Adding fake payment flow translations AND Thank You Page
const COMMON_UI_DEFAULTS = {
    cardErrorTitle: "Attenzione",
    cardErrorMsg: "Per il momento non possiamo accettare pagamenti con la carta. Scegli come procedere:",
    switchToCod: "Paga comodamente alla consegna",
    mostPopular: "Metodo più scelto",
    giveUpOffer: "Rinunciare all'offerta e allo sconto",
    confirmCod: "Conferma Pagamento alla Consegna",
    card: "Carta di Credito",
    thankYouTitle: "Grazie {name}!",
    thankYouMsg: "Il tuo ordine è stato ricevuto. Un nostro operatore ti contatterà a breve al numero {phone} per confermare l'ordine.",
    backToShop: "Torna allo Shopping",
    socialProof: "e altre 758 persone hanno acquistato"
};

const LANGUAGE_DEFAULTS: Record<string, LanguageConfig> = {
    'Italiano': { 
        currency: '€', locale: 'it-IT', countryContext: 'Italy', verifiedRole: 'Acquisto Verificato', announcement: 'SPEDIZIONE GRATUITA + PAGAMENTO ALLA CONSEGNA', ctaSubtext: 'Garanzia Soddisfatti o Rimborsati',
        formLabels: { name: 'Nome e Cognome', phone: 'Telefono', address: 'Indirizzo e Civico', city: 'Città', cap: 'CAP', email: 'Email', notes: 'Note per il corriere' },
        ui: { ...COMMON_UI_DEFAULTS, shippingInsurance: "Assicurazione Spedizione VIP", socialProof: "e altre 758 persone hanno acquistato", reviews: 'Recensioni', offer: 'Offerta', onlyLeft: 'Solo {x} rimasti', secure: 'Sicuro', returns: 'Resi', original: 'Originale', express: 'Espresso', warranty: 'Garanzia', checkoutHeader: 'Cassa', paymentMethod: 'Metodo di Pagamento', cod: 'Pagamento alla Consegna', shippingInfo: 'Dati Spedizione', completeOrder: 'Completa Ordine', orderReceived: 'OK!', orderReceivedMsg: 'Ordine Ricevuto.', techDesign: 'Tecnologia & Design', discountLabel: '-50%', certified: 'Verificato', currencyPos: 'after', legalDisclaimer: getLegalTranslation('Italiano'), privacyPolicy: 'Privacy Policy', termsConditions: 'Termini e Condizioni', cookiePolicy: 'Cookie Policy', rightsReserved: 'Tutti i diritti riservati.', generatedPageNote: 'Questa è una pagina generata automaticamente a scopo illustrativo.',
              thankYouTitle: "Grazie {name}!", thankYouMsg: "Il tuo ordine è stato ricevuto. Un nostro operatore ti contatterà a breve al numero {phone} per confermare l'ordine.", backToShop: "Torna allo Shopping" }
    },
    'Inglese': { 
        currency: '€', locale: 'en-IE', countryContext: 'Ireland or United Kingdom', verifiedRole: 'Verified Purchase', announcement: 'FREE SHIPPING + CASH ON DELIVERY', ctaSubtext: 'Money Back Guarantee',
        formLabels: { name: 'Full Name', phone: 'Phone Number', address: 'Street Address', city: 'City', cap: 'Zip Code', email: 'Email', notes: 'Delivery Notes' },
        ui: { ...COMMON_UI_DEFAULTS, shippingInsurance: "VIP Shipping Insurance", socialProof: "and 758 people purchased", cardErrorTitle: "Attention", cardErrorMsg: "We cannot accept card payments at the moment. Choose how to proceed:", switchToCod: "Pay comfortably on delivery", mostPopular: "Most Chosen", giveUpOffer: "Give up offer and discount", confirmCod: "Confirm Cash on Delivery", card: "Credit Card", reviews: 'Reviews', offer: 'Offer', onlyLeft: 'Only {x} left', secure: 'Secure', returns: 'Returns', original: 'Original', express: 'Express', warranty: 'Warranty', checkoutHeader: 'Checkout', paymentMethod: 'Payment Method', cod: 'Cash On Delivery', shippingInfo: 'Shipping Info', completeOrder: 'Complete Order', orderReceived: 'OK!', orderReceivedMsg: 'Order Received.', techDesign: 'Technology & Design', discountLabel: '-50%', certified: 'Verified', currencyPos: 'before', legalDisclaimer: getLegalTranslation('Inglese'), privacyPolicy: 'Privacy Policy', termsConditions: 'Terms & Conditions', cookiePolicy: 'Cookie Policy', rightsReserved: 'All rights reserved.', generatedPageNote: 'This is an automatically generated page for illustrative purposes.',
              thankYouTitle: "Thank you {name}!", thankYouMsg: "Your order has been received. We will call you shortly at {phone} to confirm shipment.", backToShop: "Back to Shopping" }
    },
    'Francese': { 
        currency: '€', locale: 'fr-FR', countryContext: 'France', verifiedRole: 'Achat Vérifié', announcement: 'LIVRAISON GRATUITE + PAIEMENT À LA LIVRAISON', ctaSubtext: 'Satisfait ou Remboursé',
        formLabels: { name: 'Nom et Prénom', phone: 'Téléphone', address: 'Adresse', city: 'Ville', cap: 'Code Postal', email: 'Email', notes: 'Notes de livraison' },
        ui: { ...COMMON_UI_DEFAULTS, shippingInsurance: "Assurance Expédition VIP", socialProof: "et 758 personnes ont acheté", cardErrorTitle: "Attention", cardErrorMsg: "Nous ne pouvons pas accepter les paiements par carte pour le moment. Choisissez comment procéder :", switchToCod: "Payez confortablement à la livraison", mostPopular: "Méthode la plus choisie", giveUpOffer: "Renoncer à l'offre et à la réduction", confirmCod: "Confirmer Paiement à la Livraison", card: "Carte de Crédit", reviews: 'Avis', offer: 'Offre', onlyLeft: 'Plus que {x} restants', secure: 'Sécurisé', returns: 'Retours', original: 'Original', express: 'Express', warranty: 'Garantie', checkoutHeader: 'Caisse', paymentMethod: 'Moyen de Paiement', cod: 'Paiement à la Livraison', shippingInfo: 'Infos de Livraison', completeOrder: 'Commander', orderReceived: 'OK!', orderReceivedMsg: 'Commande Reçue.', techDesign: 'Technologie et Design', discountLabel: '-50%', certified: 'Vérifié', currencyPos: 'after', legalDisclaimer: getLegalTranslation('Francese'), privacyPolicy: 'Politique de Confidentialité', termsConditions: 'Termes et Conditions', cookiePolicy: 'Politique de Cookies', rightsReserved: 'Tous droits réservés.', generatedPageNote: 'Ceci est une page générée automatiquement à des fins d\'illustration.',
              thankYouTitle: "Merci {name} !", thankYouMsg: "Votre commande a été reçue. Nous vous appellerons sous peu au {phone} pour confirmer l'expédition.", backToShop: "Retour à la boutique" }
    },
    'Tedesco': { 
        currency: '€', locale: 'de-DE', countryContext: 'Germany', verifiedRole: 'Verifizierter Kauf', announcement: 'KOSTENLOSER VERSAND + NACHNAHME', ctaSubtext: 'Geld-zurück-Garantie',
        formLabels: { name: 'Vor- und Nachname', phone: 'Telefon', address: 'Adresse', city: 'Stadt', cap: 'PLZ', email: 'E-Mail', notes: 'Lieferhinweise' },
        ui: { ...COMMON_UI_DEFAULTS, shippingInsurance: "VIP Versandversicherung", socialProof: "und 758 Personen haben gekauft", cardErrorTitle: "Achtung", cardErrorMsg: "Wir können derzeit keine Kartenzahlungen akzeptieren. Wählen Sie, wie Sie fortfahren möchten:", switchToCod: "Bequem bei Lieferung bezahlen", mostPopular: "Meistgewählte Methode", giveUpOffer: "Auf Angebot und Rabatt verzichten", confirmCod: "Nachnahme Bestätigen", card: "Kreditkarte", reviews: 'Bewertungen', offer: 'Angebot', onlyLeft: 'Nur noch {x} übrig', secure: 'Sicher', returns: 'Retouren', original: 'Original', express: 'Express', warranty: 'Garantie', checkoutHeader: 'Kasse', paymentMethod: 'Zahlungsmethode', cod: 'Nachnahme', shippingInfo: 'Versandinformationen', completeOrder: 'Bestellung Abschließen', orderReceived: 'OK!', orderReceivedMsg: 'Bestellung Erhalten.', techDesign: 'Technologie & Design', discountLabel: '-50%', certified: 'Verifiziert', currencyPos: 'after', legalDisclaimer: getLegalTranslation('Tedesco'), privacyPolicy: 'Datenschutz', termsConditions: 'AGB', cookiePolicy: 'Cookie-Richtlinie', rightsReserved: 'Alle Rechte vorbehalten.', generatedPageNote: 'Dies ist eine automatisch generierte Seite zu Illustrationszwecken.',
              thankYouTitle: "Danke {name}!", thankYouMsg: "Ihre Bestellung ist eingegangen. Wir rufen Sie in Kürze unter {phone} an, um den Versand zu bestätigen.", backToShop: "Zurück zum Einkaufen" }
    },
    'Austriaco': { 
        currency: '€', locale: 'de-AT', countryContext: 'Austria', verifiedRole: 'Verifizierter Kauf', announcement: 'KOSTENLOSER VERSAND + NACHNAHME', ctaSubtext: 'Geld-zurück-Garantie',
        formLabels: { name: 'Vor- und Nachname', phone: 'Telefon', address: 'Adresse', city: 'Stadt', cap: 'PLZ', email: 'E-Mail', notes: 'Lieferhinweise' },
        ui: { ...COMMON_UI_DEFAULTS, shippingInsurance: "VIP Versandversicherung", socialProof: "und 758 Personen haben gekauft", cardErrorTitle: "Achtung", cardErrorMsg: "Wir können derzeit keine Kartenzahlungen akzeptieren. Wählen Sie, wie Sie fortfahren möchten:", switchToCod: "Bequem bei Lieferung bezahlen", mostPopular: "Meistgewählte Methode", giveUpOffer: "Auf Angebot und Rabatt verzichten", confirmCod: "Nachnahme Bestätigen", card: "Kreditkarte", reviews: 'Bewertungen', offer: 'Angebot', onlyLeft: 'Nur noch {x} übrig', secure: 'Sicher', returns: 'Retouren', original: 'Original', express: 'Express', warranty: 'Garantie', checkoutHeader: 'Kasse', paymentMethod: 'Zahlungsmethode', cod: 'Nachnahme', shippingInfo: 'Versandinformationen', completeOrder: 'Bestellung Abschließen', orderReceived: 'OK!', orderReceivedMsg: 'Bestellung Erhalten.', techDesign: 'Technologie & Design', discountLabel: '-50%', certified: 'Verifiziert', currencyPos: 'after', legalDisclaimer: getLegalTranslation('Tedesco'), privacyPolicy: 'Datenschutz', termsConditions: 'AGB', cookiePolicy: 'Cookie-Richtlinie', rightsReserved: 'Alle Rechte vorbehalten.', generatedPageNote: 'Dies ist eine automatisch generierte Seite zu Illustrationszwecken.',
              thankYouTitle: "Danke {name}!", thankYouMsg: "Ihre Bestellung ist eingegangen. Wir rufen Sie in Kürze unter {phone} an, um den Versand zu bestätigen.", backToShop: "Zurück zum Einkaufen" }
    },
    'Spagnolo': { 
        currency: '€', locale: 'es-ES', countryContext: 'Spain', verifiedRole: 'Compra Verificada', announcement: 'ENVÍO GRATIS + PAGO CONTRA REEMBOLSO', ctaSubtext: 'Garantía de Devolución',
        formLabels: { name: 'Nombre y Apellidos', phone: 'Teléfono', address: 'Dirección', city: 'Ciudad', cap: 'Código Postal', email: 'Email', notes: 'Notas de entrega' },
        ui: { ...COMMON_UI_DEFAULTS, shippingInsurance: "Seguro de Envío VIP", socialProof: "y 758 personas compraron", cardErrorTitle: "Atención", cardErrorMsg: "No podemos aceptar pagos con tarjeta en este momento. Elija cómo proceder:", switchToCod: "Paga cómodamente contra reembolso", mostPopular: "Método más elegido", giveUpOffer: "Renunciar a la oferta y al descuento", confirmCod: "Confirmar Contra Reembolso", card: "Tarjeta de Crédito", reviews: 'Reseñas', offer: 'Oferta', onlyLeft: 'Solo quedan {x}', secure: 'Seguro', returns: 'Devoluciones', original: 'Original', express: 'Express', warranty: 'Garantía', checkoutHeader: 'Caja', paymentMethod: 'Método de Pago', cod: 'Contra Reembolso', shippingInfo: 'Datos de Envío', completeOrder: 'Completar Pedido', orderReceived: '¡OK!', orderReceivedMsg: 'Pedido Recibido.', techDesign: 'Tecnología y Diseño', discountLabel: '-50%', certified: 'Verificado', currencyPos: 'after', legalDisclaimer: getLegalTranslation('Spagnolo'), privacyPolicy: 'Política de Privacidad', termsConditions: 'Términos y Condiciones', cookiePolicy: 'Política de Cookies', rightsReserved: 'Todos los derechos reservados.', generatedPageNote: 'Esta es una página generada automáticamente con fines ilustrativos.',
              thankYouTitle: "¡Gracias {name}!", thankYouMsg: "Su pedido ha sido recibido. Le llamaremos brevemente al {phone} para confirmar el envío.", backToShop: "Volver a la tienda" }
    },
    'Portoghese': { 
        currency: '€', locale: 'pt-PT', countryContext: 'Portugal', verifiedRole: 'Compra Verificada', announcement: 'ENVIO GRÁTIS + PAGAMENTO NA ENTREGA', ctaSubtext: 'Garantia de Reembolso',
        formLabels: { name: 'Nome Completo', phone: 'Telefone', address: 'Morada', city: 'Cidade', cap: 'Código Postal', email: 'Email', notes: 'Notas de entrega' },
        ui: { ...COMMON_UI_DEFAULTS, shippingInsurance: "Seguro de Envio VIP", socialProof: "e 758 pessoas compraram", cardErrorTitle: "Atenção", cardErrorMsg: "Não podemos aceitar pagamentos com cartão no momento. Escolha como proceder:", switchToCod: "Pague confortavelmente na entrega", mostPopular: "Método mais escolhido", giveUpOffer: "Desistir da oferta e do desconto", confirmCod: "Confirmar Pagamento na Entrega", card: "Cartão de Crédito", reviews: 'Avaliações', offer: 'Oferta', onlyLeft: 'Apenas {x} restantes', secure: 'Seguro', returns: 'Devoluções', original: 'Original', express: 'Expresso', warranty: 'Garantia', checkoutHeader: 'Checkout', paymentMethod: 'Método de Pagamento', cod: 'Pagamento na Entrega', shippingInfo: 'Informações de Envio', completeOrder: 'Completar Pedido', orderReceived: 'OK!', orderReceivedMsg: 'Pedido Recebido.', techDesign: 'Tecnologia e Design', discountLabel: '-50%', certified: 'Verificado', currencyPos: 'after', legalDisclaimer: getLegalTranslation('Portoghese'), privacyPolicy: 'Política de Privacidade', termsConditions: 'Termos e Condições', cookiePolicy: 'Política de Cookies', rightsReserved: 'Todos os direitos reservados.', generatedPageNote: 'Esta é uma página gerada automaticamente para fins ilustrativos.',
              thankYouTitle: "Obrigado {name}!", thankYouMsg: "A sua encomenda foi recebida. Vamos ligar-lhe em breve para o {phone} para confirmar o envio.", backToShop: "Voltar à Loja" }
    },
    'Olandese': { 
        currency: '€', locale: 'nl-NL', countryContext: 'Netherlands', verifiedRole: 'Geverifieerde Aankoop', announcement: 'GRATIS VERZENDING + BETALEN BIJ LEVERING', ctaSubtext: 'Niet goed, geld terug',
        formLabels: { name: 'Volledige Naam', phone: 'Telefoon', address: 'Adres', city: 'Stad', cap: 'Postcode', email: 'E-mail', notes: 'Leveringsnotities' },
        ui: { ...COMMON_UI_DEFAULTS, shippingInsurance: "VIP Verzendverzekering", socialProof: "en 758 mensen kochten", cardErrorTitle: "Let op", cardErrorMsg: "We kunnen momenteel geen kaartbetalingen accepteren. Kies hoe u verder wilt gaan:", switchToCod: "Betaal comfortabel bij levering", mostPopular: "Meest gekozen methode", giveUpOffer: "Afzien van aanbod en korting", confirmCod: "Bevestig Betaling bij Levering", card: "Creditcard", reviews: 'Beoordelingen', offer: 'Aanbieding', onlyLeft: 'Nog maar {x} over', secure: 'Veilig', returns: 'Retourneren', original: 'Origineel', express: 'Expres', warranty: 'Garantie', checkoutHeader: 'Afrekenen', paymentMethod: 'Betaalmethode', cod: 'Betalen bij Levering', shippingInfo: 'Verzendgegevens', completeOrder: 'Bestellung Afronden', orderReceived: 'OK!', orderReceivedMsg: 'Bestelling Ontvangen.', techDesign: 'Technologie & Design', discountLabel: '-50%', certified: 'Geverifieerd', currencyPos: 'before', legalDisclaimer: getLegalTranslation('Olandese'), privacyPolicy: 'Privacybeleid', termsConditions: 'Algemene Voorwaarden', cookiePolicy: 'Cookiebeleid', rightsReserved: 'Alle rechten voorbehouden.', generatedPageNote: 'Dit is een automatisch gegenereerde pagina voor illustratieve doeleinden.',
              thankYouTitle: "Bedankt {name}!", thankYouMsg: "Uw bestelling is ontvangen. We bellen u binnenkort op {phone} om de verzending te bevestigen.", backToShop: "Terug naar Winkel" }
    },
    'Polacco': { 
        currency: 'zł', locale: 'pl-PL', countryContext: 'Poland', verifiedRole: 'Zweryfikowany Zakup', announcement: 'DARMOWA DOSTAWA + PŁATNOŚĆ PRZY ODBIORZE', ctaSubtext: 'Gwarancja Zwrotu Pieniędzy',
        formLabels: { name: 'Imię i Nazwisko', phone: 'Telefon', address: 'Adres', city: 'Miasto', cap: 'Kod Pocztowy', email: 'Email', notes: 'Uwagi do dostawy' },
        ui: { ...COMMON_UI_DEFAULTS, shippingInsurance: "Ubezpieczenie przesyłki VIP", socialProof: "i 758 osób kupiło", cardErrorTitle: "Uwaga", cardErrorMsg: "W tej chwili nie możemy akceptować płatności kartą. Wybierz sposób postępowania:", switchToCod: "Zapłać wygodnie przy odbiorze", mostPopular: "Najczęściej wybierana metoda", giveUpOffer: "Zrezygnuj z oferty i rabatu", confirmCod: "Potwierdź Płatność przy Odbiorze", card: "Karta Kredytowa", reviews: 'Opinie', offer: 'Oferta', onlyLeft: 'Tylko {x} sztuk', secure: 'Bezpiecznie', returns: 'Zwroty', original: 'Oryginał', express: 'Ekspres', warranty: 'Gwarancja', checkoutHeader: 'Kasa', paymentMethod: 'Metoda Płatności', cod: 'Płatność przy Odbiorze', shippingInfo: 'Dane do Wysyłki', completeOrder: 'Zamawiam', orderReceived: 'OK!', orderReceivedMsg: 'Zamówienie Przyjęte.', techDesign: 'Technologia i Design', discountLabel: '-50%', certified: 'Zweryfikowano', currencyPos: 'after', legalDisclaimer: getLegalTranslation('Polacco'), privacyPolicy: 'Polityka Prywatności', termsConditions: 'Regulamin', cookiePolicy: 'Polityka Plików Cookie', rightsReserved: 'Wszelkie prawa zastrzeżone.', generatedPageNote: 'To jest automatycznie wygenerowana strona w celach ilustracyjne.',
              thankYouTitle: "Dziękujemy {name}!", thankYouMsg: "Twoje zamówienie zostało przyjęte. Wkrótce zadzwonimy pod numer {phone}, aby potwierdzić wysyłkę.", backToShop: "Wróć do Sklepu" }
    },
    'Rumeno': { 
        currency: 'lei', locale: 'ro-RO', countryContext: 'Romania', verifiedRole: 'Achiziție Verificată', announcement: 'LIVRARE GRATUITĂ + PLATA LA LIVRARE', ctaSubtext: 'Garanție de Returnare a Banilor',
        formLabels: { name: 'Nume și Prenume', phone: 'Telefon', address: 'Adresa', city: 'Oraș', cap: 'Cod Poștal', email: 'Email', notes: 'Note livrare' },
        ui: { ...COMMON_UI_DEFAULTS, shippingInsurance: "Asigurare de expediere VIP", socialProof: "și 758 de persoane au cumpărat", cardErrorTitle: "Atenție", cardErrorMsg: "Nu putem accepta plăți cu cardul momentan. Alegeți cum să procedați:", switchToCod: "Plătiți confortabil la livrare", mostPopular: "Cea mai aleasă metodă", giveUpOffer: "Renunțați la ofertă și reducere", confirmCod: "Confirmă Plata la Livrare", card: "Card de Credit", reviews: 'Recenzii', offer: 'Ofertă', onlyLeft: 'Doar {x} rămase', secure: 'Securizat', returns: 'Retururi', original: 'Original', express: 'Expres', warranty: 'Garanție', checkoutHeader: 'Casă', paymentMethod: 'Metodă de Plată', cod: 'Plata la Livrare', shippingInfo: 'Informații Livrare', completeOrder: 'Finalizează Comanda', orderReceived: 'OK!', orderReceivedMsg: 'Comandă Primită.', techDesign: 'Tehnologie & Design', discountLabel: '-50%', certified: 'Verificat', currencyPos: 'after', legalDisclaimer: getLegalTranslation('Rumeno'), privacyPolicy: 'Politica de Confidențialitate', termsConditions: 'Termeni și Condiții', cookiePolicy: 'Politica de Cookie-uri', rightsReserved: 'Toate drepturile rezervate.', generatedPageNote: 'Aceasta este o pagină generată automat în scop ilustrativ.',
              thankYouTitle: "Mulțumesc {name}!", thankYouMsg: "Comanda dvs. a fost primită. Vă vom suna în scurt timp la {phone} pentru a confirma expedierea.", backToShop: "Înapoi la Magazin" }
    },
    'Svedese': { 
        currency: 'kr', locale: 'sv-SE', countryContext: 'Sweden', verifiedRole: 'Verifierat Köp', announcement: 'FRI FRAKT + BETALNING VID LEVERANS', ctaSubtext: 'Pengarna-tillbaka-garanti',
        formLabels: { name: 'För- och Efternamn', phone: 'Telefon', address: 'Adress', city: 'Stad', cap: 'Postnummer', email: 'E-post', notes: 'Leveransnoteringar' },
        ui: { ...COMMON_UI_DEFAULTS, shippingInsurance: "VIP Fraktförsäkring", socialProof: "och 758 personer köpte", cardErrorTitle: "Uppmärksamhet", cardErrorMsg: "Vi kan inte acceptera kortbetalningar för tillfället. Välj hur du vill fortsätta:", switchToCod: "Betala bekvämt vid leverans", mostPopular: "Mest valda metod", giveUpOffer: "Ge upp erbjudandet och rabatten", confirmCod: "Bekräfta Postförskott", card: "Kreditkort", reviews: 'Recensioner', offer: 'Erbjudande', onlyLeft: 'Endast {x} kvar', secure: 'Säker', returns: 'Returer', original: 'Original', express: 'Express', warranty: 'Garanti', checkoutHeader: 'Kassa', paymentMethod: 'Betalningsmetod', cod: 'Postförskott', shippingInfo: 'Leveransinformation', completeOrder: 'Slutför Beställning', orderReceived: 'OK!', orderReceivedMsg: 'Beställning Mottagen.', techDesign: 'Teknik & Design', discountLabel: '-50%', certified: 'Verifierad', currencyPos: 'after', legalDisclaimer: getLegalTranslation('Svedese'), privacyPolicy: 'Integritetspolicy', termsConditions: 'Villkor', cookiePolicy: 'Cookiepolicy', rightsReserved: 'Alla rättigheter förbehållna.', generatedPageNote: 'Detta är en automatiskt genererad sida i illustrativt syfte.',
              thankYouTitle: "Tack {name}!", thankYouMsg: "Din beställning har mottagits. Vi ringer dig inom kort på {phone} för att bekräfta leveransen.", backToShop: "Tillbaka till butiken" }
    },
    'Bulgaro': { 
        currency: 'лв', locale: 'bg-BG', countryContext: 'Bulgaria', verifiedRole: 'Потвърдена покупка', announcement: 'БЕЗПЛАТНА ДОСТАВКА + ПЛАЩАНЕ ПРИ ДОСТАВКА', ctaSubtext: 'Гаранция за връщане на парите',
        formLabels: { name: 'Име и Фамилия', phone: 'Телефон', address: 'Адрес', city: 'Град', cap: 'Пощенски код', email: 'Имейл', notes: 'Бележки за доставка' },
        ui: { ...COMMON_UI_DEFAULTS, shippingInsurance: "VIP Застраховка на пратката", socialProof: "и 758 души закупиха", cardErrorTitle: "Внимание", cardErrorMsg: "В момента не можем да приемаме плащания с карти. Изберете как да продължите:", switchToCod: "Платете удобно при доставка", mostPopular: "Най-избран метод", giveUpOffer: "Откажете се от офертата и отстъпката", confirmCod: "Потвърди Наложен Платеж", card: "Кредитна карта", reviews: 'Отзиви', offer: 'Оферта', onlyLeft: 'Само {x} останали', secure: 'Сигурно', returns: 'Връщане', original: 'Оригинал', express: 'Експрес', warranty: 'Гаранция', checkoutHeader: 'Поръчка', paymentMethod: 'Начин на плащане', cod: 'Наложен платеж', shippingInfo: 'Данни за доставка', completeOrder: 'Завърши поръчката', orderReceived: 'ОК!', orderReceivedMsg: 'Поръчката е получена.', techDesign: 'Технология и дизайн', discountLabel: '-50%', certified: 'Потвърдено', currencyPos: 'after', legalDisclaimer: getLegalTranslation('Bulgaro'), privacyPolicy: 'Политика за поверителност', termsConditions: 'Общи условия', cookiePolicy: 'Политика за бисквитки', rightsReserved: 'Всички права запазени.', generatedPageNote: 'Това е автоматично генерирана страница с илюстративна цел.',
              thankYouTitle: "Благодаря {name}!", thankYouMsg: "Поръчката ви е получена. Ще ви се обадим скоро на {phone}, за да потвърдим пратката.", backToShop: "Обратно към магазина" }
    },
    'Greco': { 
        currency: '€', locale: 'el-GR', countryContext: 'Greece', verifiedRole: 'Επαληθευμένη Αγορά', announcement: 'ΔΩΡΕΑΝ ΜΕΤΑΦΟΡΙΚΑ + ΑΝΤΙΚΑΤΑΒΟΛΗ', ctaSubtext: 'Εγγύηση επιστροφής χρημάτων',
        formLabels: { name: 'Ονοματεπώνυμο', phone: 'Τηλέφωνο', address: 'Διεύθυνση', city: 'Πόλη', cap: 'ΤΚ', email: 'Email', notes: 'Σημειώσεις παράδοσης' },
        ui: { ...COMMON_UI_DEFAULTS, shippingInsurance: "VIP Ασφάλιση Αποστολής", socialProof: "και 758 άτομα αγόρασαν", cardErrorTitle: "Προσοχή", cardErrorMsg: "Δεν μπορούμε να δεχτούμε πληρωμές με κάρτα αυτή τη στιγμή. Επιλέξτε πώς να προχωρήσετε:", switchToCod: "Πληρώστε άνετα με την παράδοση", mostPopular: "Η πιο δημοφιλής μέθοδος", giveUpOffer: "Παραιτηθείτε από την προσφορά και την έκπτωση", confirmCod: "Επιβεβαίωση Αντικαταβολής", card: "Πιστωτική Κάρτα", reviews: 'Κριτικές', offer: 'Προσφορά', onlyLeft: 'Μόνο {x} απομένουν', secure: 'Ασφαλές', returns: 'Επιστροφές', original: 'Γνήσιο', express: 'Εξπρές', warranty: 'Εγγύηση', checkoutHeader: 'Ταμείο', paymentMethod: 'Τρόπος Πληρωμής', cod: 'Αντικαταβολή', shippingInfo: 'Στοιχεία Αποστολής', completeOrder: 'Ολοκλήρωση Παραγγελίας', orderReceived: 'OK!', orderReceivedMsg: 'Παραγγελία Ελήφθη.', techDesign: 'Τεχνολογία & Σχεδιασμός', discountLabel: '-50%', certified: 'Επαληθευμένο', currencyPos: 'after', legalDisclaimer: getLegalTranslation('Greco'), privacyPolicy: 'Πολιτική Απορρήτου', termsConditions: 'Όροι και Προϋποθέσεις', cookiePolicy: 'Πολιτική Cookies', rightsReserved: 'Με επιφύλαξη παντός δικαιώματος.', generatedPageNote: 'Αυτή είναι μια σελίδα που δημιουργείται αυτόματα για επεξηγηματικούς σκοπούς.',
              thankYouTitle: "Ευχαριστώ {name}!", thankYouMsg: "Η παραγγελία σας ελήφθη. Θα σας καλέσουμε σύντομα στο {phone} για επιβεβαίωση της αποστολής.", backToShop: "Επιστροφή στο κατάστημα" }
    },
    'Ungherese': { 
        currency: 'Ft', locale: 'hu-HU', countryContext: 'Hungary', verifiedRole: 'Ellenőrzött Vásárlás', announcement: 'INGYENES SZÁLLÍTÁS + UTÁNVÉT', ctaSubtext: 'Pénzvisszafizetési garancia',
        formLabels: { name: 'Teljes Név', phone: 'Telefonszám', address: 'Cím', city: 'Város', cap: 'Irányítószám', email: 'E-mail', notes: 'Szállítási megjegyzések' },
        ui: { ...COMMON_UI_DEFAULTS, shippingInsurance: "VIP Szállítási Biztosítás", socialProof: "és 758 ember vásárolt", cardErrorTitle: "Figyelem", cardErrorMsg: "Jelenleg nem tudunk kártyás fizetést fogadni. Válassza ki, hogyan tovább:", switchToCod: "Fizessen kényelmesen utánvéttel", mostPopular: "A leggyakrabban választott módszer", giveUpOffer: "Mondjon le az ajánlatról és a kedvezményről", confirmCod: "Utánvét Megerősítése", card: "Hitelkártya", reviews: 'Vélemények', offer: 'Ajánlat', onlyLeft: 'Már csak {x} maradt', secure: 'Biztonságos', returns: 'Visszaküldés', original: 'Eredeti', express: 'Expressz', warranty: 'Garancia', checkoutHeader: 'Pénztár', paymentMethod: 'Fizetési mód', cod: 'Utánvét', shippingInfo: 'Szállítási adatok', completeOrder: 'Rendelés Befejezése', orderReceived: 'OK!', orderReceivedMsg: 'Rendelés Beérkezett.', techDesign: 'Technológia és Design', discountLabel: '-50%', certified: 'Ellenőrzött', currencyPos: 'after', legalDisclaimer: getLegalTranslation('Ungherese'), privacyPolicy: 'Adatvédelmi irányelvek', termsConditions: 'Felhasználási feltételek', cookiePolicy: 'Cookie szabályzat', rightsReserved: 'Minden jog fenntartva.', generatedPageNote: 'Ez egy automatikusan generált oldal illusztrációs céllal.',
              thankYouTitle: "Köszönöm {name}!", thankYouMsg: "A rendelését megkaptuk. Hamarosan felhívjuk Önt a {phone} számon a szállítás megerősítése érdekében.", backToShop: "Vissza a boltba" }
    },
    'Croato': { 
        currency: '€', locale: 'hr-HR', countryContext: 'Croatia', verifiedRole: 'Potvrđena kupnja', announcement: 'BESPLATNA DOSTAVA + PLAĆANJE POUZEĆEM', ctaSubtext: 'Jamstvo povrata novca',
        formLabels: { name: 'Ime i Prezime', phone: 'Telefon', address: 'Adresa', city: 'Grad', cap: 'Poštanski broj', email: 'E-mail', notes: 'Napomene za dostavu' },
        ui: { ...COMMON_UI_DEFAULTS, shippingInsurance: "VIP Osiguranje Pošiljke", socialProof: "i 758 ljudi je kupilo", cardErrorTitle: "Pažnja", cardErrorMsg: "Trenutno ne možemo prihvatiti plaćanje karticama. Odaberite kako nastaviti:", switchToCod: "Platite udobno pouzećem", mostPopular: "Najčešće odabrana metoda", giveUpOffer: "Odustani od ponude i popusta", confirmCod: "Potvrdi Plaćanje Pouzećem", card: "Kreditna kartica", reviews: 'Recenzije', offer: 'Ponuda', onlyLeft: 'Još samo {x}', secure: 'Sigurno', returns: 'Povrat', original: 'Original', express: 'Ekspres', warranty: 'Jamstvo', checkoutHeader: 'Blagajna', paymentMethod: 'Način plaćanja', cod: 'Plaćanje pouzećem', shippingInfo: 'Podaci o dostavi', completeOrder: 'Završi narudžbu', orderReceived: 'OK!', orderReceivedMsg: 'Narudžba zaprimljena.', techDesign: 'Tehnologija i dizajn', discountLabel: '-50%', certified: 'Potvrđeno', currencyPos: 'after', legalDisclaimer: getLegalTranslation('Croato'), privacyPolicy: 'Pravila privatnosti', termsConditions: 'Uvjeti korištenja', cookiePolicy: 'Politika kolačića', rightsReserved: 'Sva prava pridržana.', generatedPageNote: 'Ovo je automatski generirana stranica u ilustrativne svrhe.',
              thankYouTitle: "Hvala {name}!", thankYouMsg: "Vaša narudžba je zaprimljena. Uskoro ćemo vas nazvati na {phone} kako bismo potvrdili isporuku.", backToShop: "Povratak u trgovinu" }
    },
    'Serbo': { 
        currency: 'din', locale: 'sr-RS', countryContext: 'Serbia', verifiedRole: 'Proverena kupovina', announcement: 'BESPLATNA DOSTAVA + PLAĆANJE POUZEĆEM', ctaSubtext: 'Garancija povrata novca',
        formLabels: { name: 'Ime i Prezime', phone: 'Telefon', address: 'Adresa', city: 'Grad', cap: 'Poštanski broj', email: 'E-mail', notes: 'Napomene za dostavu' },
        ui: { ...COMMON_UI_DEFAULTS, shippingInsurance: "VIP Osiguranje Pošiljke", socialProof: "i 758 ljudi je kupilo", cardErrorTitle: "Pažnja", cardErrorMsg: "Trenutno ne možemo prihvatiti plaćanje karticama. Odaberite kako nastaviti:", switchToCod: "Platite udobno pouzećem", mostPopular: "Najčešće odabrana metoda", giveUpOffer: "Odustani od ponude i popusta", confirmCod: "Potvrdi Plaćanje Pouzećem", card: "Kreditna kartica", reviews: 'Recenzije', offer: 'Ponuda', onlyLeft: 'Samo {x} preostalo', secure: 'Sigurno', returns: 'Povraćaj', original: 'Original', express: 'Ekspres', warranty: 'Garancija', checkoutHeader: 'Kasa', paymentMethod: 'Način plaćanja', cod: 'Plaćanje pouzećem', shippingInfo: 'Podaci o dostavi', completeOrder: 'Završi porudžbinu', orderReceived: 'OK!', orderReceivedMsg: 'Porudžbina primljena.', techDesign: 'Tehnologija i dizajn', discountLabel: '-50%', certified: 'Provereno', currencyPos: 'after', legalDisclaimer: getLegalTranslation('Serbo'), privacyPolicy: 'Politika privatnosti', termsConditions: 'Uslovi korišćenja', cookiePolicy: 'Politika kolačića', rightsReserved: 'Sva prava zadržana.', generatedPageNote: 'Ovo je automatski generisana stranica u ilustrativne svrhe.',
              thankYouTitle: "Hvala {name}!", thankYouMsg: "Vaša porudžbina je primljena. Uskoro ćemo vas pozvati na {phone} da potvrdimo isporuku.", backToShop: "Nazad u prodavnicu" }
    }
};

const getLanguageConfig = (language: string) => {
    return LANGUAGE_DEFAULTS[language] || LANGUAGE_DEFAULTS['Italiano'];
};

const getLocalizedFormConfig = (language: string): FormFieldConfig[] => {
    const config = getLanguageConfig(language);
    const labels = config.formLabels;
    return [
        { id: 'name', label: labels.name, enabled: true, required: true, type: 'text' },
        { id: 'phone', label: labels.phone, enabled: true, required: true, type: 'tel' },
        { id: 'address', label: labels.address, enabled: true, required: true, type: 'text' },
        { id: 'city', label: labels.city, enabled: true, required: true, type: 'text' },
        { id: 'cap', label: labels.cap, enabled: true, required: false, type: 'text' },
        { id: 'email', label: labels.email, enabled: false, required: false, type: 'email' },
        { id: 'notes', label: labels.notes, enabled: true, required: false, type: 'textarea' },
    ];
};

// Helper to generate a random historical date
const getRandomHistoricalDate = (language: string = 'Italiano'): string => {
    const config = getLanguageConfig(language);
    const today = new Date();
    const minDaysAgo = 7;
    const maxDaysAgo = 120; 
    const daysAgo = Math.floor(Math.random() * (maxDaysAgo - minDaysAgo + 1)) + minDaysAgo;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - daysAgo);
    return targetDate.toLocaleDateString(config.locale);
};

// HELPER TO PROCESS IMAGE FOR GEMINI (COMPRESS & NORMALIZE)
const processImageForGemini = async (input: string): Promise<{ mimeType: string, data: string }> => {
    let base64String = input;

    // 1. If it's a URL, fetch it
    if (input.startsWith('http')) {
        try {
            const response = await fetch(input);
            const blob = await response.blob();
            base64String = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error("Failed to fetch image from URL", e);
            throw new Error("Impossible to process image URL");
        }
    }

    // 2. Compress/Resize (Crucial for avoiding 400 errors with large inputs)
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Essential for canvas with external URLs
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const MAX_SIZE = 1024; // Safe limit for Gemini
            
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            const [header, data] = dataUrl.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
            
            resolve({ mimeType, data });
        };
        img.onerror = (err) => reject(err);
        img.src = base64String;
    });
};

export const generateLandingPage = async (product: ProductDetails, reviewCount: number = 10): Promise<GeneratedContent> => {
  if (!ai) {
    throw new Error("API Key Gemini mancante.");
  }

  const modelId = 'gemini-2.5-flash';
  const targetLanguage = product.language || 'Italiano';
  const langConfig = getLanguageConfig(targetLanguage);
  const currency = langConfig.currency;
  const country = langConfig.countryContext;
  const featureCount = product.featureCount || 3;

  const textPrompt = `
    You are a world-class expert copywriter specializing in high-conversion affiliate marketing landing pages.
    
    Create content for a product with the following details:
    - Product Name: ${product.name}
    - Niche: ${product.niche}
    - Description: ${product.description}
    - Target Audience: ${product.targetAudience}
    - Tone: ${product.tone}
    - TARGET LANGUAGE: ${targetLanguage} (STRICTLY ONLY ${targetLanguage})
    - CURRENCY: ${currency} (All prices must use this currency symbol)
    - TARGET COUNTRY CONTEXT: ${country}
    - FEATURE COUNT: Exactly ${featureCount} paragraphs/features.

    ${(product.images && product.images.length > 0) || product.image ? "Use visual details from the attached images to enhance the copy." : ""}

    Produce a JSON response containing persuasive copy ENTIRELY in ${targetLanguage.toUpperCase()}.
    Ensure NO Italian or English words remain unless they are part of the product name.
    The currency for prices must be ${currency}.
    
    CRITICAL: Generate testimonials with names that are common and native to ${country}. Do not use generic English or Italian names if they don't fit the target language.
    
    For the "heroImagePrompt", describe a scene that is visually distinct to ${country}. Mention specific environmental details (e.g. architecture, landscapes, interior styles) that match ${country}.
  `;

  const parts: any[] = [{ text: textPrompt }];

  const imagesToProcess = product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []);
  // Use robust processing to avoid 400 errors during generation too
  for (const imgData of imagesToProcess) {
      if(imgData) {
        try {
            const { mimeType, data } = await processImageForGemini(imgData);
            parts.push({ inlineData: { mimeType, data } });
        } catch (e) {
            console.warn("Skipping an image due to process error", e);
        }
      }
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING, description: `H1 headline in ${targetLanguage}.` },
            subheadline: { type: Type.STRING, description: `H2 subheadline in ${targetLanguage}.` },
            heroImagePrompt: { type: Type.STRING, description: `Image generation prompt. Must explicitly describe the setting as being in ${country} with ${country}-specific visual cues.` },
            benefits: { type: Type.ARRAY, items: { type: Type.STRING }, description: `4 main benefits in ${targetLanguage}.` },
            features: {
              type: Type.ARRAY, 
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              },
              description: `Exactly ${featureCount} key features/paragraphs in ${targetLanguage}.`
            },
            testimonial: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: `A common ${targetLanguage} name.` },
                title: { type: Type.STRING },
                text: { type: Type.STRING },
                role: { type: Type.STRING }
              }
            },
            testimonials: {
              type: Type.ARRAY, 
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: `A common ${targetLanguage} name.` },
                  title: { type: Type.STRING, description: `Unique review title in ${targetLanguage}.` },
                  text: { type: Type.STRING, description: `Review text in ${targetLanguage}.` },
                  role: { type: Type.STRING },
                  rating: { type: Type.INTEGER }
                }
              },
              description: `${reviewCount} unique reviews in ${targetLanguage} with culturally accurate names.`
            },
            ctaText: { type: Type.STRING, description: `Button text (e.g. Order Now) in ${targetLanguage}.` },
            ctaSubtext: { type: Type.STRING, description: `Button subtext in ${targetLanguage}.` },
            announcementBarText: { type: Type.STRING, description: `Top bar text (e.g. Free Shipping) in ${targetLanguage}.` },
            colorScheme: { type: Type.STRING, enum: ['blue', 'green', 'red', 'purple', 'dark', 'gold'] },
            boxContent: {
              type: Type.OBJECT,
              properties: {
                enabled: { type: Type.BOOLEAN },
                title: { type: Type.STRING },
                items: { type: Type.ARRAY, items: { type: Type.STRING }}
              }
            }
          },
          required: ['headline', 'subheadline', 'benefits', 'features', 'ctaText', 'colorScheme', 'testimonial', 'testimonials']
        }
      }
    });

    if (response && response.text) {
      const content = JSON.parse(response.text);
      
      // Post-process: Inject strictly localized defaults if missing or to enforce consistency
      const processedTestimonials = (content.testimonials || []).map((t: Testimonial) => ({
          ...t,
          role: langConfig.verifiedRole, // Strict localized role
          date: getRandomHistoricalDate(targetLanguage)
      }));

      const processedTestimonial = content.testimonial ? {
          ...content.testimonial,
          role: langConfig.verifiedRole,
          date: getRandomHistoricalDate(targetLanguage)
      } : undefined;

      return { 
          ...content, 
          language: targetLanguage,
          currency: currency, // Store currency
          testimonials: processedTestimonials,
          testimonial: processedTestimonial,
          niche: product.niche,
          
          // Defaults applied if AI misses them, using localized strings
          announcementBarText: content.announcementBarText || langConfig.announcement,
          ctaSubtext: content.ctaSubtext || langConfig.ctaSubtext,
          
          price: "49.90", // Default number, currency symbol handled by UI
          originalPrice: "99.90",
          showDiscount: true,
          shippingCost: "0", // Default shipping cost
          enableShippingCost: false, // Default shipping cost hidden
          
          stockConfig: { enabled: false, quantity: 13 },
          // DEFAULT SOCIAL PROOF POPUP CONFIG
          socialProofConfig: { enabled: true, intervalSeconds: 10, maxShows: 4 },

          // NEW: Default Insurance Config
          insuranceConfig: {
            enabled: false,
            label: langConfig.ui.shippingInsurance,
            cost: '4.99',
            defaultChecked: false,
          },

          showFeatureIcons: false,
          showSocialProofBadge: true, // Default ON

          webhookUrl: "",
          formConfiguration: getLocalizedFormConfig(targetLanguage),
          generatedImages: [],
          typography: { fontFamily: 'sans', h1Size: 'lg', h2Size: 'md', bodySize: 'md' },
          
          // INJECT COMPLETE UI TRANSLATION
          uiTranslation: langConfig.ui
      } as GeneratedContent;
    }
    throw new Error("No response text generated");

  } catch (error) {
    console.error("Gemini generation error:", error);
    throw error;
  }
};

export const generateReviews = async (productName: string, niche: string, language: string, count: number = 5): Promise<Testimonial[]> => {
    if (!ai) throw new Error("API Key Gemini mancante.");

    const prompt = `
        Generate ${count} realistic product reviews for "${productName}" (Niche: ${niche}).
        Language: ${language}.
        The reviews should be positive but realistic.
        Return ONLY a JSON array of objects with these properties:
        - name (string): Name of the reviewer (culturally appropriate for ${language})
        - title (string): Review title
        - text (string): Review content
        - rating (number): 4 or 5
        - role (string): "Verified Purchase" translated to ${language}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            title: { type: Type.STRING },
                            text: { type: Type.STRING },
                            rating: { type: Type.INTEGER },
                            role: { type: Type.STRING }
                        }
                    }
                }
            }
        });

        if (response.text) {
            const reviews = JSON.parse(response.text) as Testimonial[];
            return reviews.map(r => ({ ...r, date: getRandomHistoricalDate(language) }));
        }
        return [];
    } catch (e) {
        console.error("Error generating reviews", e);
        return [];
    }
};

export const generateActionImages = async (product: ProductDetails, count: number, styles: string[], customPrompt?: string): Promise<string[]> => {
  if (!ai) return [];
  
  const baseImage = product.images?.[0] || product.image;
  if (!baseImage) return [];

  const results: string[] = [];
  const modelId = 'gemini-2.5-flash-image';

  // Use the robust processing helper to clean/fetch the image data
  let cleanMimeType = 'image/jpeg';
  let cleanBase64Data = '';
  
  try {
      const { mimeType, data } = await processImageForGemini(baseImage);
      cleanMimeType = mimeType;
      cleanBase64Data = data;
  } catch (e) {
      console.error("Failed to process base image for action generation:", e);
      return [];
  }

  for (let i = 0; i < count; i++) {
      let promptText = customPrompt ? customPrompt : "Create a high-quality professional advertising photo of this product in a realistic lifestyle setting.";
      
      if (styles.includes('technical')) {
          promptText = "Create a technical exploded view or schematic diagram of this product highlighting its features.";
      } else if (styles.includes('before_after')) {
          promptText = "Create a visual demonstration of the product's effect.";
      }
      
      if (styles.includes('human_use')) {
          promptText += " Show a real person holding or using the product in a realistic lifestyle context, making it look natural and authentic.";
      }

      if (i > 0) promptText += ` Variation ${i+1}.`;

      try {
          const response = await ai.models.generateContent({
              model: modelId,
              contents: {
                  parts: [
                      { inlineData: { mimeType: cleanMimeType, data: cleanBase64Data } },
                      { text: promptText }
                  ]
              }
          });

          const parts = response.candidates?.[0]?.content?.parts;
          if (parts) {
             for (const part of parts) {
                 if (part.inlineData && part.inlineData.data) {
                     results.push(`data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`);
                 }
             }
          }
      } catch (err) {
          console.error("Image gen error:", err);
      }
  }
  return results;
};

export const translateLandingPage = async (content: GeneratedContent, targetLanguage: string): Promise<GeneratedContent> => {
    if (!ai) throw new Error("API Key Gemini mancante.");

    const langConfig = getLanguageConfig(targetLanguage);
    
    // Simplification: asking for translation of specific fields
    const subsetToTranslate = {
        headline: content.headline,
        subheadline: content.subheadline,
        benefits: content.benefits,
        features: content.features.map(f => ({ title: f.title, description: f.description })),
        ctaText: content.ctaText,
        ctaSubtext: content.ctaSubtext,
        announcementBarText: content.announcementBarText,
        testimonials: content.testimonials?.map(t => ({ name: t.name, title: t.title, text: t.text, role: t.role })),
        testimonial: content.testimonial ? { name: content.testimonial.name, title: content.testimonial.title, text: content.testimonial.text, role: content.testimonial.role } : undefined
    };

    const prompt = `
    You are a professional translator.
    Translate the following JSON content into ${targetLanguage}.
    Maintain the EXACT structure.
    JSON: ${JSON.stringify(subsetToTranslate)}
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    if (response.text) {
        const translated = JSON.parse(response.text);
        
        // Reconstruction
        const newFeatures = content.features.map((f, i) => ({
            ...f,
            title: translated.features[i]?.title || f.title,
            description: translated.features[i]?.description || f.description
        }));

        const newTestimonials = (content.testimonials || []).map((t, i) => {
            const tr = translated.testimonials?.[i];
            return tr ? { ...t, ...tr, date: getRandomHistoricalDate(targetLanguage) } : t;
        });

        const newTestimonial = content.testimonial ? { ...content.testimonial, ...(translated.testimonial || {}), date: getRandomHistoricalDate(targetLanguage) } : undefined;

        return {
            ...content,
            language: targetLanguage,
            currency: langConfig.currency,
            uiTranslation: langConfig.ui,
            formConfiguration: getLocalizedFormConfig(targetLanguage),
            headline: translated.headline || content.headline,
            subheadline: translated.subheadline || content.subheadline,
            benefits: translated.benefits || content.benefits,
            features: newFeatures,
            ctaText: translated.ctaText || content.ctaText,
            ctaSubtext: translated.ctaSubtext || content.ctaSubtext,
            announcementBarText: translated.announcementBarText || content.announcementBarText,
            testimonials: newTestimonials,
            testimonial: newTestimonial,
            // Ensure background color is preserved
            backgroundColor: content.backgroundColor,
            customFooterCopyrightText: content.customFooterCopyrightText // Preserve custom footer
        };
    }
    throw new Error("Translation returned empty text");
};