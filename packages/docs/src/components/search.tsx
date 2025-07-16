'use client'
import { create } from '@orama/orama'
import { useDocsSearch } from 'fumadocs-core/search/client'
import type {SharedProps} from 'fumadocs-ui/components/dialog/search';
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogFooter,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  TagsList,
  TagsListItem
} from 'fumadocs-ui/components/dialog/search'
import { useI18n } from 'fumadocs-ui/contexts/i18n'
import { useState } from 'react'

function initOrama() {
  return create({
    schema: { _: 'string' },
    // https://docs.orama.com/open-source/supported-languages
    language: 'english',
  })
}

export default function DefaultSearchDialog(props: SharedProps) {
  const [tag, setTag] = useState<string | undefined>()
  const { locale } = useI18n() // (optional) for i18n
  const { search, setSearch, query } = useDocsSearch({
    type: 'static',
    initOrama,
    locale,
    tag,
  })

  return (
    <SearchDialog
      search={search}
      onSearchChange={setSearch}
      isLoading={query.isLoading}
      {...props}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList items={query.data !== 'empty' ? query.data : null} />
        <SearchDialogFooter>
          <TagsList tag={tag} onTagChange={setTag}>
            <TagsListItem value="my-value">My Value</TagsListItem>
          </TagsList>
        </SearchDialogFooter>
      </SearchDialogContent>
    </SearchDialog>
  )
}
