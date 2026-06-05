'use client'

import React from 'react'
import { useRowLabel } from '@payloadcms/ui'

export const ItineraryRowLabel: React.FC = () => {
    const { data, rowNumber } = useRowLabel()
    const title = (data as { title?: string })?.title || ''

    return (
        <span>
            {title ? `Day ${rowNumber}: ${title}` : `Day ${rowNumber}`}
        </span>
    )
}

export default ItineraryRowLabel
