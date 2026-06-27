import { Link } from 'react-router-dom'

import { SITE_NAME } from '../../config/site'
import './LegalPage.css'

const LAST_UPDATED = 'June 26, 2026'

export function TermsPage() {
  return (
    <article className="legal-page">
      <div className="legal-page-inner">
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: {LAST_UPDATED}</p>

        <div className="legal-prose">
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your use of {SITE_NAME} (the
            &ldquo;Service&rdquo;), including our website and mobile applications. By creating
            an account or using the Service, you agree to these Terms.
          </p>

          <h2>1. The Service</h2>
          <p>
            {SITE_NAME} helps households create, share, and track daily pet care schedules.
            The Service is provided free of charge. We may change, suspend, or discontinue
            features at any time.
          </p>

          <h2>2. Accounts and households</h2>
          <p>
            You are responsible for keeping your login credentials secure and for activity
            under your account. Household invite codes are intended for people you trust.
            Do not share them publicly. You are responsible for who you invite into your
            household.
          </p>

          <h2>3. Your content</h2>
          <p>
            You may enter information such as pet names, dates of birth, schedule tasks, and
            completion records. You retain ownership of your content. You grant us a limited
            license to store, process, and display it solely to operate the Service for you
            and your household members.
          </p>

          <h2>4. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to access another user&apos;s account or household without permission</li>
            <li>Interfere with or disrupt the Service or its infrastructure</li>
            <li>Scrape, reverse engineer, or misuse the Service except as permitted by law</li>
          </ul>

          <h2>5. Not veterinary or professional advice</h2>
          <p>
            Schedule templates and care routines are for general informational purposes only.
            They are not veterinary, medical, or professional advice. Always consult a
            qualified veterinarian or trainer for decisions about your pet&apos;s health and
            care.
          </p>

          <h2>6. Third-party links</h2>
          <p>
            The Service may include links to third-party websites or products, including
            affiliate links. We do not control and are not responsible for third-party sites
            or products.
          </p>

          <h2>7. Disclaimer of warranties</h2>
          <p>
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
            warranties of any kind, whether express or implied, including implied warranties
            of merchantability, fitness for a particular purpose, and non-infringement.
          </p>

          <h2>8. Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, {SITE_NAME} and its operator will not be
            liable for any indirect, incidental, special, consequential, or punitive damages,
            or any loss of data, profits, or goodwill, arising from your use of the Service.
          </p>

          <h2>9. Termination</h2>
          <p>
            You may stop using the Service at any time. We may suspend or terminate access if
            you violate these Terms or if we discontinue the Service.
          </p>

          <h2>10. Changes</h2>
          <p>
            We may update these Terms from time to time. We will post the revised Terms on
            this page and update the &ldquo;Last updated&rdquo; date. Continued use after
            changes constitutes acceptance of the updated Terms.
          </p>

          <h2>11. Contact</h2>
          <p>
            Questions about these Terms? See our{' '}
            <Link to="/privacy">Privacy Policy</Link> for how to reach us.
          </p>
        </div>
      </div>
    </article>
  )
}
