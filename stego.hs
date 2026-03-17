{-# LANGUAGE ScopedTypeVariables #-}
module Main where

import Codec.Picture
import Codec.Picture.Types
import System.Environment
import Data.Bits
import Data.Word
import Data.Char
import Control.Monad.ST
import qualified Data.Vector.Storable.Mutable as M
import qualified Data.Vector.Storable as V
import System.Exit
import Control.Monad (when)

stringToBits :: String -> [Bool]
stringToBits str = concatMap charToBits str ++ replicate 8 False

charToBits :: Char -> [Bool]
charToBits c = [ testBit (ord c) i | i <- [7, 6 .. 0] ]

bitsToChar :: [Bool] -> Char
bitsToChar bits = chr $ foldl (\acc b -> (acc `shiftL` 1) .|. (if b then 1 else 0)) 0 bits

extractString :: [Bool] -> String
extractString [] = ""
extractString bits = 
    let (charBits, rest) = splitAt 8 bits
    in if length charBits < 8 || not (or charBits)
       then ""
       else bitsToChar charBits : extractString rest

encodeVector :: V.Vector Word8 -> [Bool] -> V.Vector Word8
encodeVector vec bits = V.modify (\m -> mapM_ (\(i, b) -> do
    v <- M.read m i
    let v' = if b then v .|. 1 else v .&. 254
    M.write m i v'
  ) (zip [0..] bits)) vec

decodeVector :: V.Vector Word8 -> [Bool]
decodeVector vec = map (\v -> testBit v 0) (V.toList vec)

encodeImg :: DynamicImage -> String -> DynamicImage
encodeImg (ImageRGB8 img) msg = 
    let bits = stringToBits msg
        vec = imageData img
    in if length bits > V.length vec
       then error "Message too long for this image."
       else let vec' = encodeVector vec bits
            in ImageRGB8 (Image (imageWidth img) (imageHeight img) vec')
encodeImg (ImageRGBA8 img) msg = 
    let bits = stringToBits msg
        vec = imageData img
    in if length bits > V.length vec
       then error "Message too long for this image."
       else let vec' = encodeVector vec bits
            in ImageRGBA8 (Image (imageWidth img) (imageHeight img) vec')
encodeImg dyn msg = 
    let img = convertRGB8 dyn
        bits = stringToBits msg
        vec = imageData img
    in if length bits > V.length vec
       then error "Message too long for this image."
       else let vec' = encodeVector vec bits
            in ImageRGB8 (Image (imageWidth img) (imageHeight img) vec')

decodeImg :: DynamicImage -> String
decodeImg (ImageRGB8 img) = extractString . decodeVector $ imageData img
decodeImg (ImageRGBA8 img) = extractString . decodeVector $ imageData img
decodeImg dyn = extractString . decodeVector $ imageData (convertRGB8 dyn)

main = do
    args <- getArgs
    case args of
        ["encode", inPath, msg, outPath] -> do
            eImg <- readImage inPath
            case eImg of
                Left err -> putStrLn $ "Error reading image: " ++ err
                Right img -> do
                    let outImg = encodeImg img msg
                    savePngImage outPath outImg
                    putStrLn "Encoded successfully"
        ["decode", inPath] -> do
            eImg <- readImage inPath
            case eImg of
                Left err -> putStrLn $ "Error reading image: " ++ err
                Right img -> do
                    putStrLn $ decodeImg img
        _ -> do
            putStrLn "Usage:"
            putStrLn "  stego encode <input_image> <message> <output_image>"
            putStrLn "  stego decode <stego_image>"
