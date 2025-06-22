import PhotosManifest from './photos-manifest.json'
import type { PhotoManifest } from './types'

class PhotoLoader {
  private photos: PhotoManifest[] = []
  private photoMap: Record<string, PhotoManifest> = {}

  constructor() {
    this.getAllTags = this.getAllTags.bind(this)
    this.getPhotos = this.getPhotos.bind(this)
    this.getPhoto = this.getPhoto.bind(this)

    this.photos = PhotosManifest.data as unknown as PhotoManifest[]

    this.photos.forEach((photo) => {
      this.photoMap[photo.id] = photo
    })
  }

  getPhotos() {
    return this.photos
  }

  getPhoto(id: string) {
    return this.photoMap[id]
  }

  getAllTags() {
    const tagSet = new Set<string>()
    this.photos.forEach((photo) => {
      photo.tags.forEach((tag) => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }
}
export const photoLoader = new PhotoLoader()

export type { PhotoManifest } from './types'
export type { PickedExif, ToneAnalysis } from '@afilmory/builder'
