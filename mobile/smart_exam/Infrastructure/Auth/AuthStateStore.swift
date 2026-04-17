import Foundation

protocol AuthStateStore {
    func loadSession() throws -> AuthSession?
    func saveSession(_ session: AuthSession?) throws
}
