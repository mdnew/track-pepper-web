import { Recommendations } from '../../components/Recommendations'
import { pepperAgeDescriptor } from '../../config/pepper'
import { recommendationsForSpecies } from '../../config/recommendations'
import './AboutPage.css'

export function AboutPage() {
  const aboutRecommendations = recommendationsForSpecies('dog')
  const pepperAge = pepperAgeDescriptor()

  return (
    <section className="about-page">
      <div className="about-inner">
        <div className="about-photo-wrap">
          <img
            src="/assets/pepper.jpg"
            alt={`Pepper, a ${pepperAge} black Labrador puppy, sitting on a patio`}
            className="about-photo"
          />
        </div>
        <div className="about-copy">
          <p className="about-eyebrow">About Us</p>
          <h1>Meet Pepper</h1>
          <div className="about-story">
            <p>
              This is Pepper. She&apos;s a {pepperAge} black lab puppy. I built
              TrackPepper as a way to help my whole family take care of her.
            </p>
            <p>
              Yes, I used AI to help me — and so can you! But with my background in
              technology I thought it might be easier to just share what I built so
              other families could use it too!
            </p>
          </div>
          {aboutRecommendations.length > 0 && (
            <div className="about-recommendations">
              <Recommendations
                items={aboutRecommendations}
                title="What we use for Pepper"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
