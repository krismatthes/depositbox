'use client'

import { useEffect } from 'react'

interface Step5Props {
  data: any
  onUpdate: (data: any) => void
}

const COMMON_CLAUSES = [
  {
    title: 'Snerydning og glatførebekæmpelse',
    text: 'Lejer overtager pligt til snerydning og glatførebekæmpelse på fortov og adgangsveje til lejemålet.'
  },
  {
    title: 'Fraflytning inden ophør',
    text: 'Lejemålet skal fraflyttes og nøgler afleveres senest 14 dage før lejemålets ophør.'
  },
  {
    title: 'Rygning forbudt',
    text: 'Rygning er ikke tilladt i lejemålet eller på tilhørende arealer (altan, terrasse mv.).'
  },
  {
    title: 'Støj og nattetid',
    text: 'Der skal udvises særlig hensyn til naboer. Støjende aktiviteter er ikke tilladt mellem kl. 22:00 og 07:00.'
  },
  {
    title: 'Gæster og overnatning',
    text: 'Gæster må højst overnatte 14 sammenhængende nætter og maksimalt 30 nætter pr. kalenderår uden udlejers skriftlige tilladelse.'
  },
  {
    title: 'Have og udendørsarealer',
    text: 'Lejer har pligt til at holde have og tilhørende udendørsarealer i god stand, herunder græsslåning og ukrudtsbekæmpelse.'
  },
  {
    title: 'Fremleje og bytte',
    text: 'Fremleje kræver udlejers skriftlige samtykke. Bytte med anden bolig kræver ligeledes skriftligt samtykke.'
  },
  {
    title: 'Forsikring',
    text: 'Lejer skal tegne og vedligeholde indboforsikring, der dækker lejemålet og inventar. Kopi af police fremsendes til udlejer.'
  },
  {
    title: 'Opsigelse ved misligholdelse',
    text: 'Ved væsentlig misligholdelse af lejekontrakten kan udlejer opsige lejemålet med 14 dages varsel.'
  },
  {
    title: 'Depositumkonto',
    text: 'Depositum indsættes på særskilt konto i bank efter lejerens valg. Renter tilfalder lejer.'
  }
]

export default function Step5SaerligeVilkaar({ data, onUpdate }: Step5Props) {
  // Auto-scroll to top when this step loads
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }, [])

  const updateSpecialConditions = (text: string) => {
    onUpdate({
      ...data,
      specialConditions: text
    })
  }

  const insertClause = (clauseText: string) => {
    const currentText = data.specialConditions || ''
    const newText = currentText 
      ? `${currentText}\n\n${clauseText}`
      : clauseText
    updateSpecialConditions(newText)
  }

  const clearConditions = () => {
    updateSpecialConditions('')
  }

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-slate-800 mb-6">📝 § 11: Særlige Vilkår</h3>
      
      {/* Common Clauses */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-green-800 mb-4">📋 Almindelige Klausuler</h4>
        <p className="text-sm text-green-600 mb-4">
          Klik på en klausul for at indsætte den i særlige vilkår:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {COMMON_CLAUSES.map((clause, index) => (
            <button
              key={index}
              type="button"
              onClick={() => insertClause(clause.text)}
              className="text-left p-4 bg-white border border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all group"
            >
              <div className="font-medium text-green-800 mb-2 group-hover:text-green-900">
                {clause.title}
              </div>
              <div className="text-sm text-green-600 line-clamp-2">
                {clause.text}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Text Editor */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-slate-800">✍️ Særlige Vilkår og Aftaler</h4>
          <button
            type="button"
            onClick={clearConditions}
            className="text-sm text-red-600 hover:text-red-800 underline"
          >
            Ryd alt
          </button>
        </div>
        
        <textarea
          value={data.specialConditions || ''}
          onChange={(e) => updateSpecialConditions(e.target.value)}
          rows={12}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-y"
          placeholder="Indtast eventuelle særlige vilkår, aftaler eller betingelser som ikke er dækket af standardlejekontrakten...

Eksempler:
- Særlige regler for brug af fællesarealer
- Specifikke forpligtelser for lejer eller udlejer  
- Aftaler om vedligeholdelse eller istandsættelse
- Regler for brug af have, garage eller andre faciliteter
- Særlige økonomiske aftaler

Bemærk: Alle vilkår skal være i overensstemmelse med dansk lejelovgivning."
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-slate-500">
            Antal tegn: {(data.specialConditions || '').length}
          </p>
          <p className="text-xs text-slate-500">
            Alle vilkår skal overholde dansk lejelovgivning
          </p>
        </div>
      </div>

      {/* Legal Guidelines */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-amber-800 mb-4">⚖️ Juridiske Retningslinjer</h4>
        <div className="space-y-3 text-sm text-amber-700">
          <div className="flex items-start gap-2">
            <span className="font-medium">✅</span>
            <p>
              <strong>Tilladte vilkår:</strong> Praktiske aftaler om brug af lejemålet, 
              vedligeholdelse af særlige faciliteter, regler for fællesarealer.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">❌</span>
            <p>
              <strong>Ugyldige vilkår:</strong> Klausuler der fraviger lejers lovbestemte rettigheder, 
              urimelige forpligtelser, eller vilkår der strider mod lejeloven.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">💡</span>
            <p>
              <strong>Tip:</strong> Hold vilkårene konkrete og rimelige. Undgå at pålægge lejer 
              omfattende vedligeholdelsespligter eller urimelige begrænsninger.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">📋</span>
            <p>
              <strong>Eksempler på gyldige vilkår:</strong> Snerydning, have-pasning, 
              forsikringspligt, regler for husdyr, støjregler.
            </p>
          </div>
        </div>
      </div>

      {/* Preview Box */}
      {data.specialConditions && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-blue-800 mb-4">👁️ Forhåndsvisning</h4>
          <div className="bg-white border border-blue-200 rounded-lg p-4 max-h-40 overflow-y-auto">
            <div className="whitespace-pre-line text-sm text-slate-700">
              {data.specialConditions}
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Sådan vil de særlige vilkår fremgå af den færdige lejekontrakt.
          </p>
        </div>
      )}

      {/* Tips for Writing */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-purple-800 mb-4">💡 Tips til Skrivning</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-700">
          <div>
            <h5 className="font-medium mb-2">📝 Sprog og Stil</h5>
            <ul className="space-y-1 text-xs">
              <li>• Brug klart og forståeligt sprog</li>
              <li>• Undgå juridisk jargon</li>
              <li>• Vær præcis og konkret</li>
              <li>• Brug punktform for klarhed</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">⚖️ Juridisk Sikkerhed</h5>
            <ul className="space-y-1 text-xs">
              <li>• Overhold lejelovens rammer</li>
              <li>• Vær rimelig og proportional</li>
              <li>• Specificer rettigheder og pligter</li>
              <li>• Undgå tvetydigheder</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Template Examples */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-slate-800 mb-4">📄 Eksempel på Struktur</h4>
        <div className="bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-700">
          <div className="font-medium mb-2">Eksempel på velformulerede særlige vilkår:</div>
          <div className="whitespace-pre-line text-xs bg-slate-50 p-3 rounded font-mono">
{`1. PRAKTISKE FORPLIGTELSER
   - Lejer overtager snerydning af fortov og indkørsel
   - Have skal holdes i ordentlig stand med græsslåning min. hver 2. uge i vækstsæsonen

2. FORSIKRING OG SIKKERHED  
   - Lejer skal tegne indboforsikring på minimum 500.000 kr.
   - Kopi af forsikringspolice fremsendes senest ved overtagelse

3. BRUG AF FÆLLESAREALER
   - Vaskerum må benyttes hverdage 08:00-20:00, weekender 10:00-18:00
   - Cykler skal placeres i det anviste cykelskur`}
          </div>
        </div>
      </div>
    </div>
  )
}