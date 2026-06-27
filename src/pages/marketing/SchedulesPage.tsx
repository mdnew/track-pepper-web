import { useEffect, useState } from 'react'

import './SchedulesPage.css'

type Species = 'dog' | 'cat'

const scheduleSources: Record<Species, string> = {
  dog: '/schedules/dog-schedules-all-ages.html',
  cat: '/schedules/cat-schedules-all-ages.html',
}

export function SchedulesPage() {
  const [species, setSpecies] = useState<Species>('dog')

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== 'schedules-species') return

      const next = event.data.species
      if (next === 'dog' || next === 'cat') {
        setSpecies(next)
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return (
    <div className="schedules-page">
      <iframe
        key={species}
        title={`${species === 'dog' ? 'Dog' : 'Cat'} schedules by age`}
        src={scheduleSources[species]}
        className="schedules-frame"
      />
    </div>
  )
}
