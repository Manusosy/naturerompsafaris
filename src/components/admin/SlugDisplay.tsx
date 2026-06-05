'use client'

import React from 'react'
import { useFormFields } from '@payloadcms/ui'
import type { UIFieldClientProps } from 'payload'

type SlugDisplayProps = UIFieldClientProps & {
  urlPrefix?: string
}

export const SlugDisplay: React.FC<SlugDisplayProps> = ({ urlPrefix = '' }) => {
  const slug = useFormFields(([fields]) => fields['slug'])
  const slugValue = (slug?.value as string) || ''

  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin.replace('cms-admin', '').replace(/:\d+/, ':3000')
      : 'https://kenyatanzaniasafariadventures.com'

  const publicUrl = slugValue
    ? `${baseUrl}${urlPrefix}/${slugValue}`
    : `${baseUrl}${urlPrefix}/your-slug-here`

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        margin: '0 0 4px',
        padding: '7px 12px',
        background: 'var(--theme-elevation-50, #f6f8f2)',
        border: '1px solid var(--theme-elevation-150, #d9e2d3)',
        borderRadius: '6px',
        fontSize: '13px',
      }}
    >
      <span
        style={{
          color: 'var(--theme-elevation-600, #6b7a68)',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        🌐 Public URL:
      </span>
      {slugValue ? (
        <a
          href={publicUrl}
          rel="noopener noreferrer"
          style={{
            color: 'var(--theme-success-500, #16a34a)',
            fontWeight: 500,
            wordBreak: 'break-all',
            textDecoration: 'underline',
          }}
          target="_blank"
        >
          {urlPrefix}/{slugValue}
        </a>
      ) : (
        <span style={{ color: 'var(--theme-elevation-400, #9aaa97)', fontStyle: 'italic' }}>
          Enter a slug above to see the public URL
        </span>
      )}
    </div>
  )
}

export default SlugDisplay
