import { Link } from 'react-router-dom'

import { AppScreenshot } from '../../components/marketing/AppScreenshot'
import './HomePage.css'

export function HomePage() {
  return (
    <>
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-copy">
            <p className="home-eyebrow">For pet parents &amp; the whole family</p>
            <h1>Track your pet&apos;s day together.</h1>
            <p className="home-lede">
              A shared daily schedule for dogs and cats: feedings, care routines,
              naps, and more. Customize each pet&apos;s plan, manage multiple
              households, invite guest sitters, and stay synced across phones and
              the web in real time.
            </p>
            <div className="home-cta-row">
              <Link to="/login?tab=signup" className="home-cta-primary">
                Sign Up, It&apos;s Free
              </Link>
              <Link to="/schedules" className="home-cta-secondary">
                Family pet schedules
              </Link>
            </div>
          </div>
          <div className="home-hero-visual">
            <AppScreenshot />
          </div>
        </div>
      </section>

      <section className="home-features">
        <div className="home-features-inner">
          <article className="home-feature">
            <span className="home-feature-icon">📅</span>
            <h2>Age-based schedules</h2>
            <p>
              Expert routines for dogs and cats at every life stage, from newborn
              through senior — a solid starting point for any pet.
            </p>
          </article>
          <article className="home-feature">
            <span className="home-feature-icon">👨‍👩‍👧</span>
            <h2>Built for households</h2>
            <p>
              Mom, Dad, kids: everyone sees the same plan and knows what&apos;s done
              already.
            </p>
          </article>
          <article className="home-feature">
            <span className="home-feature-icon">📱</span>
            <h2>Web &amp; mobile</h2>
            <p>
              Check off tasks from your phone or browser. Updates sync instantly for
              the whole family.
            </p>
          </article>
          <article className="home-feature">
            <span className="home-feature-icon">✏️</span>
            <h2>Custom schedules</h2>
            <p>
              Start from age-based expert routines, then edit times, meals, and
              notes for your pet. Changes apply every day — including today.
            </p>
          </article>
          <article className="home-feature">
            <span className="home-feature-icon">🏠</span>
            <h2>Multiple households</h2>
            <p>
              Keep separate plans for home, grandparents, or a second location.
              Switch households in one tap without juggling extra accounts.
            </p>
          </article>
          <article className="home-feature">
            <span className="home-feature-icon">🧑‍🍼</span>
            <h2>Guest sitters</h2>
            <p>
              Invite a sitter or dog walker with limited access — set the dates
              and days they can view and check off tasks.
            </p>
          </article>
        </div>
      </section>

      <section className="home-bottom-cta">
        <div className="home-bottom-cta-inner">
          <h2>Ready to make pet care easier?</h2>
          <p>Create a free account, invite your household, or add a guest sitter in minutes.</p>
          <Link to="/login?tab=signup" className="home-cta-primary">
            Sign Up
          </Link>
        </div>
      </section>
    </>
  )
}
