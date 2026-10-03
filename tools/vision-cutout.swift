// 用 macOS 自带的 Vision 前景分割给图片抠背景（和预览 App 的"移除背景"同一套），输出带透明通道的 PNG。
// 用法：swiftc -O vision-cutout.swift -o vision-cutout && ./vision-cutout in.png out.png
import Foundation
import Vision
import CoreImage

let args = CommandLine.arguments
guard args.count >= 3 else { print("usage: vision-cutout in.png out.png"); exit(1) }
guard let input = CIImage(contentsOf: URL(fileURLWithPath: args[1])) else { print("cannot read \(args[1])"); exit(1) }

let handler = VNImageRequestHandler(ciImage: input, options: [:])
let request = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([request])
guard let obs = request.results?.first else { print("no foreground found"); exit(2) }

let maskBuffer = try obs.generateScaledMaskForImage(forInstances: obs.allInstances, from: handler)
let mask = CIImage(cvPixelBuffer: maskBuffer)
let clear = CIImage(color: .clear).cropped(to: input.extent)
let out = input.applyingFilter("CIBlendWithMask", parameters: [kCIInputBackgroundImageKey: clear, kCIInputMaskImageKey: mask])
try CIContext().writePNGRepresentation(of: out, to: URL(fileURLWithPath: args[2]), format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
print("ok \(args[2])")
