import type { ImageResult } from "../types"

export interface IImageService {
  generateCollectionCover(
    userId: string,
    collectionName: string,
    gameNames: string[],
  ): Promise<ImageResult>
}
