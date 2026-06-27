import { useState } from 'react'

import './SchedulesPage.css'

type Species = 'dog' | 'cat'

const scheduleSources: Record<Species, string> = {
  dog: '/schedules/dog-schedules-all-ages.html',
  cat: '/schedules/cat-schedules-all-ages.html',
}

export function SchedulesPage() {
  const [species, setSpecies] = useState<Species>('dog')

  return (
    <div className="schedules-page">
      <div className="schedules-toolbar">
        <div className="schedules-toolbar-inner">
          <p className="schedules-toolbar-label">Reference schedules by age</p>
          <div className="schedules-species-toggle" role="tablist" aria-label="Pet species">
            <button
              type="button"
              role="tab"
              aria-selected={species === 'dog'}
              className={species === 'dog' ? 'active' : ''}
              onClick={() => setSpecies('dog')}
            >
              🐕 Dogs
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={species === 'cat'}
              className={species === 'cat' ? 'active' : ''}
              onClick={() => setSpecies('cat')}
            >
              🐈 Cats
            </button>
          </div>
        </div>
      </div>
      <iframe
        key={species}
        title={`${species === 'dog' ? 'Dog' : 'Cat'} schedules by age`}
        src={scheduleSources[species]}
        className="schedules-frame"
      />
    </div>
  )
}
