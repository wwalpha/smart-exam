import SwiftUI

struct LucideIcon: View {
    enum Kind {
        case mail
        case lock
        case arrowRight
        case arrowLeft
        case moreVertical
        case fileText
        case download
        case share2
        case zoomIn
        case zoomOut
    }

    let kind: Kind
    let size: CGFloat
    let color: Color
    let lineWidth: CGFloat

    init(kind: Kind, size: CGFloat = 24, color: Color, lineWidth: CGFloat = 2) {
        self.kind = kind
        self.size = size
        self.color = color
        self.lineWidth = lineWidth
    }

    var body: some View {
        Canvas { context, canvasSize in
            draw(in: &context, canvasSize: canvasSize)
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }

    private func draw(in context: inout GraphicsContext, canvasSize: CGSize) {
        switch kind {
        case .mail:
            stroke(roundedRect(x: 3, y: 5, width: 18, height: 14, radius: 2), in: &context, canvasSize: canvasSize)
            stroke(polyline([(3, 7), (12, 13), (21, 7)]), in: &context, canvasSize: canvasSize)
            stroke(polyline([(3, 19), (9, 12)]), in: &context, canvasSize: canvasSize)
            stroke(polyline([(21, 19), (15, 12)]), in: &context, canvasSize: canvasSize)
        case .lock:
            stroke(roundedRect(x: 5, y: 11, width: 14, height: 10, radius: 2), in: &context, canvasSize: canvasSize)
            stroke(lockShackle(), in: &context, canvasSize: canvasSize)
        case .arrowRight:
            stroke(polyline([(5, 12), (19, 12)]), in: &context, canvasSize: canvasSize)
            stroke(polyline([(12, 5), (19, 12), (12, 19)]), in: &context, canvasSize: canvasSize)
        case .arrowLeft:
            stroke(polyline([(19, 12), (5, 12)]), in: &context, canvasSize: canvasSize)
            stroke(polyline([(12, 5), (5, 12), (12, 19)]), in: &context, canvasSize: canvasSize)
        case .moreVertical:
            fill(circle(center: (12, 5), radius: 1.7), in: &context, canvasSize: canvasSize)
            fill(circle(center: (12, 12), radius: 1.7), in: &context, canvasSize: canvasSize)
            fill(circle(center: (12, 19), radius: 1.7), in: &context, canvasSize: canvasSize)
        case .fileText:
            stroke(fileOutline(), in: &context, canvasSize: canvasSize)
            stroke(polyline([(14, 2), (14, 8), (20, 8)]), in: &context, canvasSize: canvasSize)
            stroke(polyline([(16, 13), (8, 13)]), in: &context, canvasSize: canvasSize)
            stroke(polyline([(16, 17), (8, 17)]), in: &context, canvasSize: canvasSize)
            stroke(polyline([(10, 9), (8, 9)]), in: &context, canvasSize: canvasSize)
        case .download:
            stroke(polyline([(21, 15), (21, 19), (3, 19), (3, 15)]), in: &context, canvasSize: canvasSize)
            stroke(polyline([(7, 10), (12, 15), (17, 10)]), in: &context, canvasSize: canvasSize)
            stroke(polyline([(12, 15), (12, 3)]), in: &context, canvasSize: canvasSize)
        case .share2:
            stroke(polyline([(8, 13), (16, 17)]), in: &context, canvasSize: canvasSize)
            stroke(polyline([(16, 7), (8, 11)]), in: &context, canvasSize: canvasSize)
            stroke(circle(center: (18, 5), radius: 3), in: &context, canvasSize: canvasSize)
            stroke(circle(center: (6, 12), radius: 3), in: &context, canvasSize: canvasSize)
            stroke(circle(center: (18, 19), radius: 3), in: &context, canvasSize: canvasSize)
        case .zoomIn:
            drawMagnifier(plus: true, in: &context, canvasSize: canvasSize)
        case .zoomOut:
            drawMagnifier(plus: false, in: &context, canvasSize: canvasSize)
        }
    }

    private func drawMagnifier(plus: Bool, in context: inout GraphicsContext, canvasSize: CGSize) {
        stroke(circle(center: (10.5, 10.5), radius: 7.5), in: &context, canvasSize: canvasSize)
        stroke(polyline([(16, 16), (21, 21)]), in: &context, canvasSize: canvasSize)
        stroke(polyline([(7.5, 10.5), (13.5, 10.5)]), in: &context, canvasSize: canvasSize)
        if plus {
            stroke(polyline([(10.5, 7.5), (10.5, 13.5)]), in: &context, canvasSize: canvasSize)
        }
    }

    private func stroke(_ path: Path, in context: inout GraphicsContext, canvasSize: CGSize) {
        context.stroke(
            path.applying(transform(for: canvasSize)),
            with: .color(color),
            style: StrokeStyle(
                lineWidth: lineWidth * min(canvasSize.width, canvasSize.height) / 24,
                lineCap: .round,
                lineJoin: .round
            )
        )
    }

    private func fill(_ path: Path, in context: inout GraphicsContext, canvasSize: CGSize) {
        context.fill(path.applying(transform(for: canvasSize)), with: .color(color))
    }

    private func transform(for size: CGSize) -> CGAffineTransform {
        CGAffineTransform(scaleX: size.width / 24, y: size.height / 24)
    }

    private func roundedRect(x: CGFloat, y: CGFloat, width: CGFloat, height: CGFloat, radius: CGFloat) -> Path {
        Path(roundedRect: CGRect(x: x, y: y, width: width, height: height), cornerRadius: radius)
    }

    private func circle(center: (CGFloat, CGFloat), radius: CGFloat) -> Path {
        Path(ellipseIn: CGRect(
            x: center.0 - radius,
            y: center.1 - radius,
            width: radius * 2,
            height: radius * 2
        ))
    }

    private func polyline(_ points: [(CGFloat, CGFloat)]) -> Path {
        var path = Path()
        guard let first = points.first else { return path }

        path.move(to: CGPoint(x: first.0, y: first.1))
        for point in points.dropFirst() {
            path.addLine(to: CGPoint(x: point.0, y: point.1))
        }

        return path
    }

    private func lockShackle() -> Path {
        var path = Path()
        path.move(to: CGPoint(x: 7, y: 11))
        path.addLine(to: CGPoint(x: 7, y: 8))
        path.addCurve(
            to: CGPoint(x: 17, y: 8),
            control1: CGPoint(x: 7, y: 4.7),
            control2: CGPoint(x: 17, y: 4.7)
        )
        path.addLine(to: CGPoint(x: 17, y: 11))
        return path
    }

    private func fileOutline() -> Path {
        var path = Path()
        path.move(to: CGPoint(x: 14, y: 2))
        path.addLine(to: CGPoint(x: 6, y: 2))
        path.addCurve(
            to: CGPoint(x: 4, y: 4),
            control1: CGPoint(x: 4.9, y: 2),
            control2: CGPoint(x: 4, y: 2.9)
        )
        path.addLine(to: CGPoint(x: 4, y: 20))
        path.addCurve(
            to: CGPoint(x: 6, y: 22),
            control1: CGPoint(x: 4, y: 21.1),
            control2: CGPoint(x: 4.9, y: 22)
        )
        path.addLine(to: CGPoint(x: 18, y: 22))
        path.addCurve(
            to: CGPoint(x: 20, y: 20),
            control1: CGPoint(x: 19.1, y: 22),
            control2: CGPoint(x: 20, y: 21.1)
        )
        path.addLine(to: CGPoint(x: 20, y: 8))
        path.addLine(to: CGPoint(x: 14, y: 2))
        return path
    }
}
