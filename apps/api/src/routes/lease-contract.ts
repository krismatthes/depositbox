import { FastifyPluginAsync } from 'fastify'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { authenticateUser } from '../middleware/auth'

const leaseContractRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticateUser)

  // Generate PDF lease contract
  fastify.post('/lease-contract/generate-pdf', async (request, reply) => {
    try {
      const contractData = request.body as any

      // Create a new PDF document
      const pdfDoc = await PDFDocument.create()
      // Use Times Roman fonts which have better character support including Danish characters
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)

      // Professional A4 PDF settings according to specification
      const PAGE_WIDTH = 595.28  // A4 width in points
      const PAGE_HEIGHT = 841.89  // A4 height in points
      const MARGIN_TOP_BOTTOM = 62.36 // 22mm converted to points
      const MARGIN_LEFT_RIGHT = 51.02 // 18mm converted to points
      const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN_LEFT_RIGHT * 2)
      const CONTENT_HEIGHT = PAGE_HEIGHT - (MARGIN_TOP_BOTTOM * 2)

      // Professional color palette (CMYK-safe)
      const PRIMARY_BLUE = rgb(0.043, 0.239, 0.568) // #0B3D91 - professional Danish blue
      const SECONDARY_GRAY = rgb(0.420, 0.447, 0.502) // #6B7280 - neutral gray
      const ACCENT_GREEN = rgb(0.059, 0.522, 0.361) // #0F845C - success/validation green
      const TEXT_BLACK = rgb(0.067, 0.067, 0.067) // #111111 - high contrast black
      const LIGHT_GRAY = rgb(0.949, 0.953, 0.961) // #F2F4F5 - subtle background
      const WHITE = rgb(1, 1, 1)

      // Typography scale for professional document hierarchy
      const FONT_SIZES = {
        title: 20,        // Document title
        subtitle: 14,     // Document subtitle
        section: 12,      // Section headers (§)
        body: 10,         // Normal paragraph text
        small: 9,         // Fine print, labels
        caption: 8        // Footer, disclaimers
      }

      // Add first page
      let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      let currentY = PAGE_HEIGHT - MARGIN_TOP_BOTTOM
      let pageNumber = 1

      // Professional typography helper functions
      // Sanitize text to support Danish characters while preventing encoding issues
      const sanitizeText = (text: string): string => {
        return text
          .replace(/□/g, '[X]') // Replace square symbols that can't be rendered
          .replace(/§/g, 'Para.') // Replace § symbol with "Para." for better PDF compatibility
          // Keep Danish characters (æ, ø, å, Æ, Ø, Å) and other common European characters
          // This regex keeps: Basic ASCII + Latin-1 Supplement + Latin Extended-A
          .replace(/[^\x00-\x7F\u00C0-\u00FF\u0100-\u017F]/g, '') // Remove only problematic Unicode, keep Latin extended
      }

      const addText = (text: string, x: number, y: number, options: any = {}) => {
        const fontSize = options.size || FONT_SIZES.body
        const font = options.bold ? helveticaBold : helveticaFont
        const color = options.color || TEXT_BLACK
        const sanitizedText = sanitizeText(text)
        
        page.drawText(sanitizedText, {
          x,
          y,
          size: fontSize,
          font,
          color,
          lineHeight: fontSize * 1.4, // Professional line spacing
          ...options
        })
      }

      const addCenteredText = (text: string, y: number, options: any = {}) => {
        const fontSize = options.size || FONT_SIZES.body
        const font = options.bold ? helveticaBold : helveticaFont
        const sanitizedText = sanitizeText(text)
        const textWidth = font.widthOfTextAtSize(sanitizedText, fontSize)
        addText(sanitizedText, (PAGE_WIDTH - textWidth) / 2, y, options)
      }

      const addRightAlignedText = (text: string, y: number, options: any = {}) => {
        const fontSize = options.size || FONT_SIZES.body
        const font = options.bold ? helveticaBold : helveticaFont
        const sanitizedText = sanitizeText(text)
        const textWidth = font.widthOfTextAtSize(sanitizedText, fontSize)
        addText(sanitizedText, PAGE_WIDTH - MARGIN_LEFT_RIGHT - textWidth, y, options)
      }

      const addLine = (x1: number, y1: number, x2: number, y2: number, color = SECONDARY_GRAY, thickness = 0.5) => {
        page.drawLine({
          start: { x: x1, y: y1 },
          end: { x: x2, y: y2 },
          thickness,
          color
        })
      }

      const addFormField = (label: string, x: number, y: number, width: number, height = 20) => {
        // Form field background
        page.drawRectangle({
          x,
          y: y - height + 5,
          width,
          height,
          color: WHITE,
          borderColor: SECONDARY_GRAY,
          borderWidth: 0.5
        })
        
        // Field label
        addText(label, x, y + 5, { size: FONT_SIZES.small, color: SECONDARY_GRAY })
        
        return y - height - 10 // Return next Y position
      }

      const addSection = (title: string, content: string[], spacing = 16) => {
        // Professional section header with subtle styling
        page.drawRectangle({
          x: MARGIN_LEFT_RIGHT,
          y: currentY - 28,
          width: CONTENT_WIDTH,
          height: 28,
          color: LIGHT_GRAY,
          borderColor: PRIMARY_BLUE,
          borderWidth: 0.5
        })
        
        addText(title, MARGIN_LEFT_RIGHT + 12, currentY - 19, { 
          size: FONT_SIZES.section, 
          bold: true, 
          color: PRIMARY_BLUE 
        })
        currentY -= 40

        // Add content with proper typography
        content.forEach(line => {
          if (line.trim()) {
            // Check for special formatting
            if (line.startsWith('  ')) {
              // Indented content
              addText(line.trim(), MARGIN_LEFT_RIGHT + 24, currentY, { 
                size: FONT_SIZES.body, 
                color: SECONDARY_GRAY 
              })
            } else if (line.includes(':')) {
              // Label:value pairs - make label bold
              const parts = line.split(':')
              if (parts.length >= 2) {
                const label = parts[0].trim() + ':'
                const value = parts.slice(1).join(':').trim()
                addText(label, MARGIN_LEFT_RIGHT + 18, currentY, { 
                  size: FONT_SIZES.body, 
                  bold: true 
                })
                const labelWidth = helveticaBold.widthOfTextAtSize(label, FONT_SIZES.body)
                addText(value, MARGIN_LEFT_RIGHT + 18 + labelWidth + 8, currentY, { 
                  size: FONT_SIZES.body 
                })
              } else {
                addText(line, MARGIN_LEFT_RIGHT + 18, currentY, { size: FONT_SIZES.body })
              }
            } else {
              // Regular content
              addText(line, MARGIN_LEFT_RIGHT + 18, currentY, { size: FONT_SIZES.body })
            }
            currentY -= spacing
          } else {
            // Empty line - smaller spacing
            currentY -= spacing * 0.6
          }
        })
        currentY -= 8
      }

      const addPageNumber = () => {
        addCenteredText(`Side ${pageNumber}`, 30, { 
          size: FONT_SIZES.caption, 
          color: SECONDARY_GRAY 
        })
      }

      const checkNewPage = (requiredSpace = 120) => {
        if (currentY < MARGIN_TOP_BOTTOM + requiredSpace) {
          // Add page number to current page
          addPageNumber()
          
          // Create new page
          page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
          pageNumber++
          currentY = PAGE_HEIGHT - MARGIN_TOP_BOTTOM
          
          // Add document header on subsequent pages
          if (pageNumber > 1) {
            addLine(MARGIN_LEFT_RIGHT, currentY, PAGE_WIDTH - MARGIN_LEFT_RIGHT, currentY, SECONDARY_GRAY)
            currentY -= 8
            addText('Lejekontrakt - Typeformular A10', MARGIN_LEFT_RIGHT, currentY, { 
              size: FONT_SIZES.small, 
              color: SECONDARY_GRAY 
            })
            addRightAlignedText(`Side ${pageNumber}`, currentY, { 
              size: FONT_SIZES.small, 
              color: SECONDARY_GRAY 
            })
            currentY -= 25
          }
          
          return true
        }
        return false
      }

      // PROFESSIONAL DOCUMENT HEADER
      // Elegant header design with Danish legal authority
      const headerHeight = 100
      
      // Header background with gradient effect (simulated with rectangles)
      page.drawRectangle({
        x: 0,
        y: PAGE_HEIGHT - headerHeight,
        width: PAGE_WIDTH,
        height: headerHeight,
        color: PRIMARY_BLUE
      })
      
      // Subtle highlight stripe
      page.drawRectangle({
        x: 0,
        y: PAGE_HEIGHT - headerHeight,
        width: PAGE_WIDTH,
        height: 3,
        color: ACCENT_GREEN
      })

      // Professional title typography
      addCenteredText('LEJEKONTRAKT', PAGE_HEIGHT - 35, { 
        size: FONT_SIZES.title, 
        bold: true, 
        color: WHITE 
      })
      
      addCenteredText('Typeformular A10 - Boligudlejning', PAGE_HEIGHT - 55, { 
        size: FONT_SIZES.subtitle, 
        color: rgb(0.9, 0.9, 0.9) 
      })
      
      const today = new Date().toLocaleDateString('da-DK', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      })
      addCenteredText(`Udarbejdet ${today}`, PAGE_HEIGHT - 75, { 
        size: FONT_SIZES.small, 
        color: rgb(0.8, 0.8, 0.8) 
      })
      
      // Document ID for tracking
      const docId = `LC-${Date.now().toString().slice(-6)}`
      addText(`Dok.nr: ${docId}`, MARGIN_LEFT_RIGHT, PAGE_HEIGHT - 20, { 
        size: FONT_SIZES.caption, 
        color: rgb(0.7, 0.7, 0.7) 
      })

      currentY = PAGE_HEIGHT - headerHeight - 20

      // Generate comprehensive Danish lease contract according to Typeformular A10
      
      // § 1: PARTER OG DET LEJEDE
      const landlordData = contractData.udlejer || contractData.landlord
      const tenantData = contractData.lejer || contractData.tenants
      const propertyData = contractData.ejendom || contractData.property
      
      const landlordInfo = [
        `Navn: ${landlordData?.navn || landlordData?.name}`,
        `Adresse: ${landlordData?.adresse || landlordData?.address}`,
        `CVR/CPR: ${landlordData?.cvr || landlordData?.cvrCpr}`
      ]

      let tenantInfo = []
      if (tenantData && tenantData.length > 0 && (tenantData[0].navn || tenantData[0].name)) {
        tenantData.forEach((tenant: any, index: number) => {
          tenantInfo.push(`${index + 1}. ${tenant.navn || tenant.name || 'Udfyldes af lejer'}`)
          tenantInfo.push(`   CPR: ${tenant.cpr || 'Udfyldes af lejer'}`)
          tenantInfo.push(`   Email: ${tenant.email || 'Udfyldes af lejer'}`)
          tenantInfo.push(`   Adresse: ${tenant.adresse || tenant.currentAddress || 'Udfyldes af lejer'}`)
          tenantInfo.push('')
        })
      } else {
        tenantInfo.push('Udfyldes af lejer ved modtagelse af kontrakt')
      }

      const propertyTypes: any = {
        apartment: 'Lejlighed',
        lejlighed: 'Lejlighed',
        house: 'Hus',
        room: 'Værelse',
        accessorisk_vaerelse: 'Accessorisk værelse',
        separat_vaerelse: 'Separat værelse',
        studio: 'Studio'
      }

      const propertyInfo = [
        `Adresse: ${propertyData?.adresse || propertyData?.address}`,
        `Type: ${propertyTypes[contractData.lejetype || propertyData?.type] || contractData.lejetype || propertyData?.type}`,
        `Areal: ${propertyData?.areal_m2 || propertyData?.area} m²`,
        `Antal værelser: ${propertyData?.rum || propertyData?.rooms}`,
        `Overtagelsesdato: ${new Date(contractData.startdato || propertyData?.moveInDate).toLocaleDateString('da-DK')}`
      ]

      // Add facilities/brugsret
      const facilities = contractData.brugsret || propertyData?.facilities
      if (facilities) {
        const facilityList = []
        if (typeof facilities === 'object' && !Array.isArray(facilities)) {
          if (facilities.cykel) facilityList.push('Cykelparkering')
          if (facilities.parkering) facilityList.push(`Parkering: ${facilities.parkering}`)
          if (facilities.loft_eller_kaelder) facilityList.push(`Loft/kælder: ${facilities.loft_eller_kaelder}`)
          if (facilities.faelles_faciliteter) facilityList.push(`Fællesfaciliteter: ${facilities.faelles_faciliteter}`)
        } else if (Array.isArray(facilities) && facilities.length > 0) {
          facilityList.push(...facilities)
        }
        if (facilityList.length > 0) {
          propertyInfo.push(`Brugsret til: ${facilityList.join(', ')}`)
        }
      }

      addSection('§ 1. PARTER OG DET LEJEDE', [
        'UDLEJER:',
        ...landlordInfo,
        '',
        'LEJER(E):',
        ...tenantInfo,
        '',
        'DET LEJEDE:',
        ...propertyInfo
      ])

      // § 2: BEGYNDELSE OG OPHØR
      checkNewPage(120)
      const leaseInfo = []
      const isLimited = contractData.tidsbegraenset || contractData.leaseType === 'limited'
      const startDate = contractData.startdato || propertyData?.moveInDate
      
      leaseInfo.push(`Lejeforholdet begynder den ${new Date(startDate).toLocaleDateString('da-DK')}.`)
      leaseInfo.push('')
      
      if (isLimited) {
        const endDate = contractData.slutdato
        if (endDate) {
          leaseInfo.push(`Lejemålet udlejes på bestemt tid og ophører den ${new Date(endDate).toLocaleDateString('da-DK')}.`)
        } else {
          leaseInfo.push('Lejemålet udlejes på bestemt tid.')
        }
        leaseInfo.push('')
        leaseInfo.push('Saglig begrundelse for tidsbegrænsning:')
        const reason = contractData.saglig_begrundelse_tidsbegraensning || contractData.limitedReason
        if (reason) {
          const reasonLines = reason.match(/.{1,75}/g) || []
          reasonLines.forEach((line: string) => {
            leaseInfo.push(`  ${line.trim()}`)
          })
        }
      } else {
        leaseInfo.push('Lejemålet udlejes på ubestemt tid.')
      }
      
      leaseInfo.push('')
      
      // Opsigelsesregler i henhold til dansk lejeret
      const isAccessoryRoom = contractData.lejetype === 'accessorisk_vaerelse'
      if (isAccessoryRoom) {
        leaseInfo.push('OPSIGELSE:')
        leaseInfo.push('Lejer kan opsige lejemålet med 1 måneds varsel til den 1. i en måned.')
        leaseInfo.push('Udlejers opsigelse kan kun ske i overensstemmelse med lejelovens §§ 170-175.')
      } else {
        leaseInfo.push('OPSIGELSE:')
        leaseInfo.push('Lejer kan opsige lejemålet med 3 måneders varsel til den 1. i en måned.')
        leaseInfo.push('Udlejers opsigelse kan kun ske i overensstemmelse med lejelovens §§ 170-175.')
      }

      addSection('§ 2. BEGYNDELSE OG OPHØR', leaseInfo)

      // § 3: LEJE OG BETALING
      checkNewPage(150)
      const economyData = contractData.economy || {}
      const monthlyRent = contractData.maanedsleje_ex_forbrug || economyData.monthlyRent || 0
      const paymentDay = contractData.forfaldsdato_dag_i_mdr || 1
      
      const rentInfo = [
        `Månedlig husleje (ekskl. forbrug): ${monthlyRent.toLocaleString()} DKK`,
        `Forfalder forud den ${paymentDay}. i måneden`,
        ''
      ]
      
      // Lejefastsættelse efter dansk lejeret
      if (contractData.fri_leje) {
        rentInfo.push('LEJEFASTSÆTTELSE:')
        rentInfo.push(`Leje fastsat som fri leje efter lejelovens § 54 (${contractData.fri_leje_grundlag || 'se begrundelse'}).`)
      } else if (contractData.reguleret_kommune) {
        rentInfo.push('LEJEFASTSÆTTELSE:')
        rentInfo.push('Leje fastsat omkostningsbestemt efter lejelovens kapitel VII A.')
      } else {
        rentInfo.push('LEJEFASTSÆTTELSE:')
        rentInfo.push('Leje fastsat efter det lejedes værdi, jf. lejelovens § 58.')
      }
      
      rentInfo.push('')
      
      // Betalingsoplysninger
      const paymentInfo = contractData.betalingsinfo
      if (paymentInfo?.modtager) {
        rentInfo.push('BETALING:')
        rentInfo.push(`Modtager: ${paymentInfo.modtager}`)
        if (paymentInfo.iban_eller_reg_konto) {
          rentInfo.push(`Konto: ${paymentInfo.iban_eller_reg_konto}`)
        }
        if (paymentInfo.reference) {
          rentInfo.push(`Reference: ${paymentInfo.reference}`)
        }
        rentInfo.push('')
      }
      
      addSection('§ 3. LEJE OG BETALING', rentInfo)
      
      // § 4: FORBRUG (A CONTO)
      checkNewPage(100)
      const consumptionData = contractData.aconto || {}
      const legacyEconomy = economyData
      
      const consumptionInfo = [
        'Lejer betaler følgende a conto beløb:',
        ''
      ]
      
      let totalConsumption = 0
      if ((consumptionData.varme || legacyEconomy.heating) > 0) {
        const amount = consumptionData.varme || legacyEconomy.heating
        consumptionInfo.push(`Varme: ${amount.toLocaleString()} DKK månedligt`)
        totalConsumption += amount
      }
      if ((consumptionData.vand || legacyEconomy.water) > 0) {
        const amount = consumptionData.vand || legacyEconomy.water
        consumptionInfo.push(`Vand: ${amount.toLocaleString()} DKK månedligt`)
        totalConsumption += amount
      }
      if ((consumptionData.el || legacyEconomy.electricity) > 0) {
        const amount = consumptionData.el || legacyEconomy.electricity
        consumptionInfo.push(`El: ${amount.toLocaleString()} DKK månedligt`)
        totalConsumption += amount
      }
      if ((consumptionData.internet_tv || legacyEconomy.other) > 0) {
        const amount = consumptionData.internet_tv || legacyEconomy.other
        consumptionInfo.push(`Internet/TV: ${amount.toLocaleString()} DKK månedligt`)
        totalConsumption += amount
      }
      
      if (totalConsumption === 0) {
        consumptionInfo.push('Ingen a conto betalinger.')
      } else {
        consumptionInfo.push('')
        consumptionInfo.push(`Total a conto: ${totalConsumption.toLocaleString()} DKK månedligt`)
      }
      
      const totalMonthly = monthlyRent + totalConsumption
      consumptionInfo.push('')
      consumptionInfo.push(`TOTAL MÅNEDLIG BETALING: ${totalMonthly.toLocaleString()} DKK`)
      consumptionInfo.push('')
      consumptionInfo.push('A conto beløb afregnes årligt efter dokumenteret forbrug.')
      
      addSection('§ 4. FORBRUG (A CONTO)', consumptionInfo)
      
      // DEPOSITUM OG FORUDBETALING
      checkNewPage(80)
      const depositInfo = []
      const depositMonths = contractData.depositum_maaneder || 0
      const prepaidMonths = contractData.forudbetalt_leje_maaneder || 0
      const depositAmount = depositMonths * monthlyRent || economyData.deposit || 0
      const prepaidAmount = prepaidMonths * monthlyRent || economyData.prepaidRent || 0
      
      if (depositAmount > 0) {
        depositInfo.push(`Depositum: ${depositAmount.toLocaleString()} DKK (${depositMonths} måneders husleje)`)
        depositInfo.push('Depositum forrentes og reguleres forholdsmæssigt ved lejestigninger.')
        depositInfo.push('')
      }
      
      if (prepaidAmount > 0) {
        depositInfo.push(`Forudbetalt leje: ${prepaidAmount.toLocaleString()} DKK (${prepaidMonths} måneders husleje)`)
        depositInfo.push('Forudbetalt leje dækker de sidste måneder af lejeforholdet.')
        depositInfo.push('')
      }
      
      if (depositAmount + prepaidAmount > 0) {
        depositInfo.push(`Total indbetaling ved overtagelse: ${(depositAmount + prepaidAmount).toLocaleString()} DKK`)
        
        // Escrow information if applicable
        if (contractData.escrow_deponering?.aktiv) {
          depositInfo.push('')
          depositInfo.push('ESCROW DEPONERING:')
          depositInfo.push(`Depositum og forudbetalt leje deponeres hos ${contractData.escrow_deponering.udbyder}.`)
          depositInfo.push('Beløbet frigives ved kontraktindgåelse eller tilbagebetales ved aflysning.')
          if (contractData.escrow_deponering.konto_oplysninger) {
            depositInfo.push(`Konto: ${contractData.escrow_deponering.konto_oplysninger}`)
          }
        }
      } else {
        depositInfo.push('Ingen depositum eller forudbetaling kræves.')
      }
      
      addSection('DEPOSITUM OG FORUDBETALING', depositInfo)

      // § 5: VEDLIGEHOLDELSE OG ISTANDSÆTTELSE
      checkNewPage(120)
      const maintenanceData = contractData.vedligehold || {}
      const legacyConditions = contractData.conditions || {}
      
      const maintenanceInfo = []
      
      if (maintenanceData.indvendig_lejer || legacyConditions.maintenanceResponsibility === 'tenant') {
        maintenanceInfo.push('INDVENDIG VEDLIGEHOLDELSE: Lejer har pligt til indvendig vedligeholdelse.')
        maintenanceInfo.push('Dette omfatter maling, tapetsering og almindelig vedligeholdelse af inventar.')
      } else {
        maintenanceInfo.push('INDVENDIG VEDLIGEHOLDELSE: Udlejer har pligt til indvendig vedligeholdelse.')
      }
      
      maintenanceInfo.push('')
      
      if (maintenanceData.udvendig_udlejer !== false) {
        maintenanceInfo.push('UDVENDIG VEDLIGEHOLDELSE: Udlejer har pligt til udvendig vedligeholdelse.')
        maintenanceInfo.push('Dette omfatter tag, facade, vinduer og fællesområder.')
      }
      
      maintenanceInfo.push('')
      
      if (maintenanceData.hvidevarer_lejer) {
        maintenanceInfo.push('HVIDEVARER: Lejer har vedligeholdelses- og reparationspligt for hvidevarer.')
      }
      
      // Syn-regler efter dansk lejeret
      if (contractData.udlejer_har_flere_end_1_lejemaal) {
        maintenanceInfo.push('')
        maintenanceInfo.push('IND-/FRAFLYTNINGSSYN:')
        maintenanceInfo.push('Der afholdes indflytningssyn ved overtagelse og fraflytningssyn ved fraflytning.')
        maintenanceInfo.push('Rapport udleveres til begge parter.')
      } else {
        maintenanceInfo.push('')
        maintenanceInfo.push('ISTANDSÆTTELSESKRAV:')
        maintenanceInfo.push('Udlejer skal fremsætte eventuelle istandsættelseskrav inden 2 uger efter nøgleaflevering.')
      }
      
      if (legacyConditions.newlyRenovated) {
        maintenanceInfo.push('')
        maintenanceInfo.push('Lejemålet er nyistandsat ved overtagelsen.')
      }
      
      addSection('§ 5. VEDLIGEHOLDELSE OG ISTANDSÆTTELSE', maintenanceInfo)
      
      // § 6: BRUGSRET/FÆLLESFACILITETER  
      checkNewPage(80)
      const usageInfo = []
      const usageRights = contractData.brugsret || {}
      
      if (usageRights.cykel === 'ja' || usageRights.cykel === true) {
        usageInfo.push('• Cykelparkering')
      }
      if (usageRights.parkering) {
        usageInfo.push(`• Parkering: ${usageRights.parkering}`)
      }
      if (usageRights.loft_eller_kaelder) {
        usageInfo.push(`• Loft/kælder: ${usageRights.loft_eller_kaelder}`)
      }
      if (usageRights.faelles_faciliteter) {
        usageInfo.push(`• Fællesfaciliteter: ${usageRights.faelles_faciliteter}`)
      }
      
      // Legacy compatibility
      if (legacyConditions.inventory && legacyConditions.inventory.length > 0) {
        usageInfo.push(`• Medfølgende inventar: ${legacyConditions.inventory.join(', ')}`)
      }
      
      if (usageInfo.length === 0) {
        usageInfo.push('Ingen særlige brugsrettigheder følger med lejemålet.')
      }
      
      addSection('§ 6. BRUGSRET/FÆLLESFACILITETER', usageInfo)
      
      // § 7: HUSORDEN
      checkNewPage(60)
      const houseRulesInfo = []
      if (contractData.husorden_vedhaeftet) {
        houseRulesInfo.push('Der er udarbejdet husorden for ejendommen.')
        houseRulesInfo.push('Husorden er vedlagt som bilag og udgør en del af lejekontrakten.')
        houseRulesInfo.push('Lejer er forpligtet til at overholde husordenen.')
      } else {
        houseRulesInfo.push('Der er ikke udarbejdet særlig husorden for ejendommen.')
        houseRulesInfo.push('Almindelige regler for god skik og orden skal overholdes.')
      }
      
      addSection('§ 7. HUSORDEN', houseRulesInfo)
      
      // § 8: HUSDYR/RYGNING
      checkNewPage(60)
      const behaviorInfo = []
      
      const petsAllowed = contractData.husdyr_tilladt !== false && 
                         (legacyConditions.petsAllowed !== false)
      behaviorInfo.push(`HUSDYR: ${petsAllowed ? 'Husdyr er tilladt i lejemålet.' : 'Husdyr er ikke tilladt i lejemålet.'}`)
      
      const smokingAllowed = contractData.rygning_tilladt === true
      behaviorInfo.push(`RYGNING: ${smokingAllowed ? 'Rygning er tilladt i lejemålet.' : 'Rygning er ikke tilladt i lejemålet.'}`)
      
      addSection('§ 8. HUSDYR/RYGNING', behaviorInfo)
      
      // § 9: FREMLEJE/UDLÅN
      checkNewPage(80)
      const subleaseInfo = [
        'DELVIS FREMLEJE:'
      ]
      
      if (contractData.fremleje_tilladt_delvist) {
        subleaseInfo.push('Delvis fremleje er tilladt med udlejers forudgående samtykke.')
        subleaseInfo.push('Udlejer kan kun nægte samtykke af saglige grunde.')
        subleaseInfo.push('Fremleje kan ske i op til 2 år ved midlertidigt fravær.')
      } else {
        subleaseInfo.push('Delvis fremleje kræver udlejers forudgående skriftlige samtykke.')
      }
      
      subleaseInfo.push('')
      subleaseInfo.push('FULD FREMLEJE:')
      subleaseInfo.push('Fuld fremleje kræver altid udlejers forudgående skriftlige samtykke.')
      
      addSection('§ 9. FREMLEJE/UDLÅN', subleaseInfo)
      
      // § 10: REGULERING AF LEJE
      checkNewPage(100)
      const regulationInfo = []
      
      if (contractData.npi_regulering?.aktiv) {
        regulationInfo.push('NETTOPRISINDEKS-REGULERING:')
        regulationInfo.push('Lejen reguleres årligt i overensstemmelse med udviklingen i nettoprisindeks.')
        const regDate = contractData.npi_regulering.maaned_dag || '01-01'
        regulationInfo.push(`Regulering sker den ${regDate} hvert år med virkning fra den 1. i samme måned.`)
        regulationInfo.push('Reguleringen beregnes efter følgende formel:')
        regulationInfo.push('Ny leje = Gældende leje × (Nyt indeks / Basisindeks)')
        regulationInfo.push('')
        regulationInfo.push('Basisindeks er nettoprisindekset for den første fulde måned af lejeforholdet.')
      } else if (!contractData.fri_leje && contractData.reguleret_kommune) {
        regulationInfo.push('OMKOSTNINGSBESTEMT LEJE:')
        regulationInfo.push('Leje kan reguleres efter dokumenterede omkostningsstigninger.')
        regulationInfo.push('Regulering sker i overensstemmelse med lejelovens kapitel VII A.')
      } else {
        regulationInfo.push('LEJEREGULERING:')
        regulationInfo.push('Leje kan reguleres efter gældende lejelovgivning.')
        if (contractData.fri_leje) {
          regulationInfo.push('Fri leje kan reguleres efter markedslejen for tilsvarende lejemål.')
        }
      }
      
      addSection('§ 10. REGULERING AF LEJE', regulationInfo)

      // § 11: SÆRLIGE VILKÅR (FRAVIGELSER)
      checkNewPage(100)
      const specialConditions = contractData.saerlige_vilkaar || 
                               (contractData.specialConditions ? [contractData.specialConditions] : [])
      
      const specialInfo = [
        'Følgende særlige vilkår gælder for lejemålet:',
        ''
      ]
      
      if (specialConditions && specialConditions.length > 0) {
        specialConditions.forEach((condition: string, index: number) => {
          if (condition && condition.trim()) {
            const lines = condition.split('\n').filter((line: string) => line.trim())
            lines.forEach(line => {
              specialInfo.push(`${index + 1}. ${line.trim()}`)
            })
            specialInfo.push('')
          }
        })
      } else {
        specialInfo.push('Ingen særlige vilkår eller fravigelser fra standardkontrakten.')
        specialInfo.push('')
      }
      
      // Digital kommunikation
      if (contractData.kommunikation?.email || contractData.kommunikation?.digital_signatur) {
        specialInfo.push('DIGITAL KOMMUNIKATION:')
        if (contractData.kommunikation.email) {
          specialInfo.push('Parterne accepterer elektronisk korrespondance via email.')
        }
        if (contractData.kommunikation.digital_signatur) {
          specialInfo.push('Parterne accepterer digital signatur af dokumenter.')
        }
        specialInfo.push('')
      }
      
      // Juridisk kompetence
      const municipality = contractData.tvist_huslejenaevn_kommune || 'ejendommens beliggenhedskommune'
      specialInfo.push('TVISTER:')
      specialInfo.push(`Huslejenævnet i ${municipality} er kompetent første instans for tvister.`)
      
      addSection('§ 11. SÆRLIGE VILKÅR', specialInfo)

      // § 12: UNDERSKRIFT
      checkNewPage(250)
      currentY -= 20

      // Signatures section
      page.drawRectangle({
        x: MARGIN_LEFT_RIGHT,
        y: currentY - 25,
        width: CONTENT_WIDTH,
        height: 25,
        color: LIGHT_GRAY
      })
      
      addText('§ 12. UNDERSKRIFT', MARGIN_LEFT_RIGHT + 10, currentY - 18, { size: 12, bold: true, color: PRIMARY_BLUE })
      currentY -= 40
      
      // Contract completion info
      addText('Kontrakten er udfyldt i 2 eksemplarer.', MARGIN_LEFT_RIGHT + 15, currentY, { size: 10 })
      currentY -= 15
      addText('Begge parter får et eksemplar.', MARGIN_LEFT_RIGHT + 15, currentY, { size: 10 })
      currentY -= 30
      
      // Digital signature note
      if (contractData.kommunikation?.digital_signatur) {
        addText('Denne kontrakt kan underskrives digitalt.', MARGIN_LEFT_RIGHT + 15, currentY, { size: 10, color: PRIMARY_BLUE })
        currentY -= 25
      }

      // Landlord signature
      addText('Udlejer:', MARGIN_LEFT_RIGHT + 15, currentY, { size: 11, bold: true })
      addText('Dato:', MARGIN_LEFT_RIGHT + 300, currentY, { size: 11, bold: true })
      currentY -= 30

      addLine(MARGIN_LEFT_RIGHT + 15, currentY, MARGIN_LEFT_RIGHT + 250, currentY)
      addLine(MARGIN_LEFT_RIGHT + 300, currentY, MARGIN_LEFT_RIGHT + 450, currentY)
      currentY -= 15

      const landlordName = landlordData?.navn || landlordData?.name || ''
      addText(landlordName, MARGIN_LEFT_RIGHT + 15, currentY, { size: 10 })
      currentY -= 40

      // Tenant signatures
      if (tenantData && tenantData.length > 0 && (tenantData[0].navn || tenantData[0].name)) {
        tenantData.forEach((tenant: any, index: number) => {
          addText(`Lejer ${index + 1}:`, MARGIN_LEFT_RIGHT + 15, currentY, { size: 11, bold: true })
          addText('Dato:', MARGIN_LEFT_RIGHT + 300, currentY, { size: 11, bold: true })
          currentY -= 30

          addLine(MARGIN_LEFT_RIGHT + 15, currentY, MARGIN_LEFT_RIGHT + 250, currentY)
          addLine(MARGIN_LEFT_RIGHT + 300, currentY, MARGIN_LEFT_RIGHT + 450, currentY)
          currentY -= 15

          const tenantName = tenant.navn || tenant.name || 'Udfyldes af lejer'
          addText(tenantName, MARGIN_LEFT_RIGHT + 15, currentY, { size: 10 })
          currentY -= 40
        })
      } else {
        addText('Lejer:', MARGIN_LEFT_RIGHT + 15, currentY, { size: 11, bold: true })
        addText('Dato:', MARGIN_LEFT_RIGHT + 300, currentY, { size: 11, bold: true })
        currentY -= 30

        addLine(MARGIN_LEFT_RIGHT + 15, currentY, MARGIN_LEFT_RIGHT + 250, currentY)
        addLine(MARGIN_LEFT_RIGHT + 300, currentY, MARGIN_LEFT_RIGHT + 450, currentY)
        currentY -= 15

        addText('Udfyldes af lejer', MARGIN_LEFT_RIGHT + 15, currentY, { size: 10 })
        currentY -= 40
      }
      
      // Bilagsliste
      addText('BILAG TIL LEJEKONTRAKTEN:', MARGIN_LEFT_RIGHT + 15, currentY, { size: 11, bold: true })
      currentY -= 20
      
      const attachments = []
      if (contractData.husorden_vedhaeftet) attachments.push('□ Husorden')
      if (contractData.udlejer_har_flere_end_1_lejemaal) {
        attachments.push('□ Ind-/fraflytningsrapport')
      }
      if (totalConsumption > 0) attachments.push('□ A conto-specifikation')
      if (legacyConditions.inventory?.length > 0) attachments.push('□ Inventarliste')
      if (contractData.escrow_deponering?.aktiv) attachments.push('□ Escrow-dokumentation')
      
      if (attachments.length === 0) {
        addText('□ Ingen bilag', MARGIN_LEFT_RIGHT + 15, currentY, { size: 9 })
      } else {
        attachments.forEach(attachment => {
          addText(attachment, MARGIN_LEFT_RIGHT + 15, currentY, { size: 9 })
          currentY -= 15
        })
      }

      // Footer with legal disclaimer
      const footerY = 50
      addLine(MARGIN_LEFT_RIGHT, footerY + 25, PAGE_WIDTH - MARGIN_LEFT_RIGHT, footerY + 25)
      addCenteredText('Denne lejekontrakt er udarbejdet efter Typeformular A10 og gældende dansk lejeret', footerY + 15, { size: 8, color: SECONDARY_GRAY })
      addCenteredText('Dette dokument er udarbejdet efter gældende regler men udgør ikke konkret juridisk rådgivning', footerY, { size: 7, color: SECONDARY_GRAY })

      // Generate PDF bytes
      const pdfBytes = await pdfDoc.save()
      
      // Generate validation notes and JSON specification for logging
      const validationNotes = generateValidationNotes(contractData)
      const jsonSpec = generateJsonFieldSpec(contractData)
      
      // Log for debugging (in production, this could be saved to database)
      console.log('=== DANISH LEASE CONTRACT GENERATED ===')
      console.log('JSON Field Specification:', JSON.stringify(jsonSpec, null, 2))
      console.log('Validation Notes:', validationNotes)
      console.log('=========================================')

      // Set response headers for PDF download
      const landlordNameForFile = (contractData.udlejer?.navn || contractData.landlord?.name || 'lejekontrakt').replace(/[^a-zA-Z0-9]/g, '-')
      const propertyAddr = (contractData.ejendom?.adresse || contractData.property?.address || '').replace(/[^a-zA-Z0-9]/g, '-')
      const filename = `lejekontrakt-${landlordNameForFile}-${propertyAddr}.pdf`.substring(0, 100)
      
      reply.type('application/pdf')
      reply.header('Content-Disposition', `attachment; filename="${filename}"`)
      reply.send(Buffer.from(pdfBytes))

    } catch (error) {
      console.error('Danish lease contract PDF generation error:', error)
      reply.status(500).send({ 
        error: 'Failed to generate Danish lease contract PDF', 
        details: 'Kontroller at alle obligatoriske felter er udfyldt korrekt'
      })
    }
  })

  // Send PDF lease contract via email
  fastify.post('/lease-contract/send-email', async (request, reply) => {
    try {
      const contractData = request.body as any
      const { recipientEmail } = contractData

      if (!recipientEmail) {
        return reply.status(400).send({ error: 'Recipient email is required' })
      }

      // Generate PDF first
      const pdfDoc = await PDFDocument.create()
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      // Add first page (same as above)
      const page = pdfDoc.addPage([595.28, 841.89])
      const { width, height } = page.getSize()

      let currentY = height - 50

      // Helper function to add text
      const addText = (text: string, x: number, y: number, options: any = {}) => {
        page.drawText(text, {
          x,
          y,
          size: options.size || 11,
          font: options.bold ? helveticaBold : helveticaFont,
          color: rgb(0, 0, 0),
          ...options
        })
      }

      // Add centered text
      const addCenteredText = (text: string, y: number, options: any = {}) => {
        const textWidth = helveticaFont.widthOfTextAtSize(text, options.size || 11)
        addText(text, (width - textWidth) / 2, y, options)
      }

      // Header
      addCenteredText('LEJEKONTRAKT', currentY, { size: 20, bold: true })
      currentY -= 30
      addCenteredText('Typeformular A10 - Boligudlejning', currentY, { size: 14 })
      currentY -= 50

      // Brief message for email version
      addText('Denne lejekontrakt er sendt via email.', 50, currentY)
      currentY -= 20
      addText('Kontakten kan udfyldes og underskrives af både udlejer og lejer.', 50, currentY)
      currentY -= 40

      // Generate PDF bytes
      const pdfBytes = await pdfDoc.save()

      // For now, we'll simulate email sending
      // In a real implementation, you would integrate with an email service like SendGrid, Nodemailer, etc.
      console.log(`Simulating email send to: ${recipientEmail}`)
      console.log('PDF size:', pdfBytes.length, 'bytes')

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      reply.send({ 
        message: 'Email sent successfully',
        recipient: recipientEmail,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('Email sending error:', error)
      reply.status(500).send({ error: 'Failed to send email' })
    }
  })
}

// Validation notes for Danish lease law compliance
function generateValidationNotes(contractData: any): string[] {
  const notes = []
  const monthlyRent = contractData.maanedsleje_ex_forbrug || contractData.economy?.monthlyRent || 0
  const depositMonths = contractData.depositum_maaneder || 0
  const prepaidMonths = contractData.forudbetalt_leje_maaneder || 0
  
  // Depositum validation
  if (depositMonths >= 0 && depositMonths <= 3) {
    notes.push('✓ Depositum inden for lovlige grænser (0-3 måneders husleje)')
  } else {
    notes.push('✗ FEJL: Depositum overstiger 3 måneders husleje')
  }
  
  // Forudbetalt leje validation
  if (prepaidMonths >= 0 && prepaidMonths <= 3) {
    notes.push('✓ Forudbetalt leje inden for lovlige grænser (0-3 måneders husleje)')
  } else {
    notes.push('✗ FEJL: Forudbetalt leje overstiger 3 måneders husleje')
  }
  
  // Total validation
  if (depositMonths + prepaidMonths <= 3) {
    notes.push('✓ Samlet depositum + forudbetaling ikke over 3 måneders husleje')
  } else {
    notes.push('✗ FEJL: Samlet depositum + forudbetaling overstiger 3 måneders husleje')
  }
  
  // Opsigelsesvarsel validation
  const isAccessory = contractData.lejetype === 'accessorisk_vaerelse'
  const noticeText = isAccessory ? '1 måned (accessorisk værelse)' : '3 måneder (almindeligt lejemål)'
  notes.push(`✓ Lejers opsigelsesvarsel: ${noticeText}`)
  
  // Syn-regler validation
  if (contractData.udlejer_har_flere_end_1_lejemaal) {
    notes.push('✓ Ind-/fraflytningssyn påkrævet (udlejer har flere lejemål)')
  } else {
    notes.push('✓ 2-ugers frist for udlejers istandsættelseskrav')
  }
  
  // Fri leje validation
  if (contractData.fri_leje && contractData.fri_leje_grundlag) {
    notes.push(`✓ Fri leje korrekt begrundet: ${contractData.fri_leje_grundlag}`)
  } else if (contractData.fri_leje) {
    notes.push('⚠ Fri leje mangler begrundelse efter lejelovens § 54')
  }
  
  // NPI regulering validation
  if (contractData.npi_regulering?.aktiv && contractData.lejegrundlag === 'omkostningsbestemt') {
    notes.push('⚠ NPI-regulering ikke kompatibel med omkostningsbestemt leje')
  } else if (contractData.npi_regulering?.aktiv) {
    notes.push('✓ NPI-regulering korrekt implementeret')
  }
  
  return notes
}

// Generate JSON field specification
function generateJsonFieldSpec(contractData: any): any {
  return {
    udlejer: contractData.udlejer || contractData.landlord,
    lejer: contractData.lejer || contractData.tenants,
    ejendom: contractData.ejendom || contractData.property,
    reguleret_kommune: contractData.reguleret_kommune || false,
    udlejer_har_flere_end_1_lejemaal: contractData.udlejer_har_flere_end_1_lejemaal || true,
    lejetype: contractData.lejetype || 'lejlighed',
    startdato: contractData.startdato || contractData.property?.moveInDate,
    tidsbegraenset: contractData.tidsbegraenset || contractData.leaseType === 'limited',
    slutdato: contractData.slutdato,
    saglig_begrundelse_tidsbegraensning: contractData.saglig_begrundelse_tidsbegraensning || contractData.limitedReason,
    maanedsleje_ex_forbrug: contractData.maanedsleje_ex_forbrug || contractData.economy?.monthlyRent,
    forfaldsdato_dag_i_mdr: contractData.forfaldsdato_dag_i_mdr || 1,
    betalingsinfo: contractData.betalingsinfo || {},
    aconto: contractData.aconto || {},
    depositum_maaneder: contractData.depositum_maaneder || 3,
    forudbetalt_leje_maaneder: contractData.forudbetalt_leje_maaneder || 0,
    fri_leje: contractData.fri_leje || false,
    fri_leje_grundlag: contractData.fri_leje_grundlag,
    lejegrundlag: contractData.lejegrundlag || 'omkostningsbestemt',
    npi_regulering: contractData.npi_regulering || { aktiv: false, maaned_dag: '01-01' },
    vedligehold: contractData.vedligehold || {},
    brugsret: contractData.brugsret || {},
    husdyr_tilladt: contractData.husdyr_tilladt || false,
    rygning_tilladt: contractData.rygning_tilladt || false,
    fremleje_tilladt_delvist: contractData.fremleje_tilladt_delvist || true,
    saerlige_vilkaar: contractData.saerlige_vilkaar || [],
    escrow_deponering: contractData.escrow_deponering || { aktiv: false, udbyder: 'PayProff' },
    kommunikation: contractData.kommunikation || { email: true, digital_signatur: true },
    tvist_huslejenaevn_kommune: contractData.tvist_huslejenaevn_kommune || 'ejendommens kommune'
  }
}

export default leaseContractRoutes