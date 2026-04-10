import Capacitor
import CoreMotion
import Foundation
import HealthKit

@objc(MGKHealthPlugin)
public class MGKHealthPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MGKHealthPlugin"
    public let jsName = "MGKHealth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getTodaySteps", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startWalk", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pauseWalk", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopWalk", returnType: CAPPluginReturnPromise)
    ]

    private let healthStore = HKHealthStore()
    private let pedometer = CMPedometer()
    private var walkSessionId: String?
    private var currentWalkSegmentStartDate: Date?
    private var isPedometerActive = false
    private var accumulatedWalkTimeSeconds = 0
    private var accumulatedWalkStepCount = 0
    private var accumulatedWalkDistanceKm = 0.0
    private var latestWalkStepCount = 0
    private var latestWalkDistanceKm = 0.0
    private var walkUpdateTimer: Timer?

    @objc func getTodaySteps(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable(),
              let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            call.reject("HealthKit을 사용할 수 없는 기기입니다.")
            return
        }

        healthStore.requestAuthorization(toShare: [], read: [stepType]) { [weak self] success, error in
            if let error {
                call.reject(error.localizedDescription)
                return
            }

            guard success else {
                call.reject("HealthKit 걸음 수 권한이 허용되지 않았습니다.")
                return
            }

            self?.readTodaySteps(stepType: stepType, call: call)
        }
    }

    @objc func startWalk(_ call: CAPPluginCall) {
        guard CMPedometer.isStepCountingAvailable() else {
            call.reject("이 기기에서는 실시간 걸음 수 측정을 사용할 수 없습니다.")
            return
        }

        if let walkSessionId {
            if !isPedometerActive {
                startPedometerUpdates(sessionId: walkSessionId, startedAt: Date())
            }

            call.resolve(makeWalkPayload(
                sessionId: walkSessionId,
                stepCount: latestWalkStepCount,
                walkTimeSeconds: currentWalkTimeSeconds(),
                distanceKm: latestWalkDistanceKm,
                status: "WALKING"
            ))
            return
        }

        let sessionId = UUID().uuidString
        let startedAt = Date()

        walkSessionId = sessionId
        currentWalkSegmentStartDate = startedAt
        accumulatedWalkTimeSeconds = 0
        accumulatedWalkStepCount = 0
        accumulatedWalkDistanceKm = 0
        latestWalkStepCount = 0
        latestWalkDistanceKm = 0
        startPedometerUpdates(sessionId: sessionId, startedAt: startedAt)

        call.resolve(makeWalkPayload(
            sessionId: sessionId,
            stepCount: 0,
            walkTimeSeconds: 0,
            distanceKm: 0,
            status: "WALKING"
        ))
    }

    @objc func pauseWalk(_ call: CAPPluginCall) {
        guard let walkSessionId else {
            call.resolve(makeWalkPayload(
                sessionId: "",
                stepCount: 0,
                walkTimeSeconds: 0,
                distanceKm: 0,
                status: "PAUSED"
            ))
            return
        }

        pausePedometerUpdates()

        call.resolve(makeWalkPayload(
            sessionId: walkSessionId,
            stepCount: latestWalkStepCount,
            walkTimeSeconds: accumulatedWalkTimeSeconds,
            distanceKm: latestWalkDistanceKm,
            status: "PAUSED"
        ))
    }

    @objc func stopWalk(_ call: CAPPluginCall) {
        pausePedometerUpdates()

        guard let walkSessionId else {
            call.resolve(makeWalkPayload(
                sessionId: "",
                stepCount: 0,
                walkTimeSeconds: 0,
                distanceKm: 0,
                status: "COMPLETED"
            ))
            return
        }

        let payload = makeWalkPayload(
            sessionId: walkSessionId,
            stepCount: latestWalkStepCount,
            walkTimeSeconds: accumulatedWalkTimeSeconds,
            distanceKm: latestWalkDistanceKm,
            status: "COMPLETED"
        )

        self.walkSessionId = nil
        self.currentWalkSegmentStartDate = nil
        self.isPedometerActive = false
        self.accumulatedWalkTimeSeconds = 0
        self.accumulatedWalkStepCount = 0
        self.accumulatedWalkDistanceKm = 0
        self.latestWalkStepCount = 0
        self.latestWalkDistanceKm = 0

        call.resolve(payload)
    }

    private func startPedometerUpdates(sessionId: String, startedAt: Date) {
        currentWalkSegmentStartDate = startedAt
        isPedometerActive = true
        startWalkUpdateTimer(sessionId: sessionId)

        pedometer.startUpdates(from: startedAt) { [weak self] data, error in
            guard let self else { return }

            if let error {
                self.notifyListeners("walkError", data: [
                    "message": error.localizedDescription
                ])
                return
            }

            guard let data else { return }

            let segmentStepCount = data.numberOfSteps.intValue
            let segmentDistanceKm = (data.distance?.doubleValue ?? 0) / 1000
            let stepCount = self.accumulatedWalkStepCount + segmentStepCount
            let distanceKm = self.accumulatedWalkDistanceKm + segmentDistanceKm
            let walkTimeSeconds = self.currentWalkTimeSeconds()

            self.latestWalkStepCount = stepCount
            self.latestWalkDistanceKm = distanceKm
            self.emitWalkUpdate(
                sessionId: sessionId,
                stepCount: stepCount,
                walkTimeSeconds: walkTimeSeconds,
                distanceKm: distanceKm,
                status: "WALKING"
            )
        }
    }

    private func pausePedometerUpdates() {
        guard isPedometerActive else { return }

        pedometer.stopUpdates()
        stopWalkUpdateTimer()
        accumulatedWalkStepCount = latestWalkStepCount
        accumulatedWalkDistanceKm = latestWalkDistanceKm

        if let currentWalkSegmentStartDate {
            accumulatedWalkTimeSeconds += Int(Date().timeIntervalSince(currentWalkSegmentStartDate))
        }

        currentWalkSegmentStartDate = nil
        isPedometerActive = false
    }

    private func currentWalkTimeSeconds() -> Int {
        guard isPedometerActive, let currentWalkSegmentStartDate else {
            return accumulatedWalkTimeSeconds
        }

        return accumulatedWalkTimeSeconds + Int(Date().timeIntervalSince(currentWalkSegmentStartDate))
    }

    private func startWalkUpdateTimer(sessionId: String) {
        DispatchQueue.main.async {
            self.walkUpdateTimer?.invalidate()
            self.walkUpdateTimer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { [weak self] _ in
                guard let self, self.isPedometerActive else { return }

                self.emitWalkUpdate(
                    sessionId: sessionId,
                    stepCount: self.latestWalkStepCount,
                    walkTimeSeconds: self.currentWalkTimeSeconds(),
                    distanceKm: self.latestWalkDistanceKm,
                    status: "WALKING"
                )
            }
        }
    }

    private func stopWalkUpdateTimer() {
        DispatchQueue.main.async {
            self.walkUpdateTimer?.invalidate()
            self.walkUpdateTimer = nil
        }
    }

    private func emitWalkUpdate(
        sessionId: String,
        stepCount: Int,
        walkTimeSeconds: Int,
        distanceKm: Double,
        status: String
    ) {
        DispatchQueue.main.async {
            self.notifyListeners("walkUpdate", data: self.makeWalkPayload(
                sessionId: sessionId,
                stepCount: stepCount,
                walkTimeSeconds: walkTimeSeconds,
                distanceKm: distanceKm,
                status: status
            ))
        }
    }

    private func readTodaySteps(stepType: HKQuantityType, call: CAPPluginCall) {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        let predicate = HKQuery.predicateForSamples(
            withStart: startOfDay,
            end: Date(),
            options: .strictStartDate
        )
        let query = HKStatisticsQuery(
            quantityType: stepType,
            quantitySamplePredicate: predicate,
            options: .cumulativeSum
        ) { _, result, error in
            if let error {
                call.reject(error.localizedDescription)
                return
            }

            let stepCount = result?
                .sumQuantity()?
                .doubleValue(for: HKUnit.count()) ?? 0

            if stepCount > 0 {
                self.resolve(call: call, stepCount: Int(stepCount))
                return
            }

            self.readTodayStepSamples(stepType: stepType, predicate: predicate, call: call)
        }

        healthStore.execute(query)
    }

    private func readTodayStepSamples(
        stepType: HKQuantityType,
        predicate: NSPredicate,
        call: CAPPluginCall
    ) {
        let query = HKSampleQuery(
            sampleType: stepType,
            predicate: predicate,
            limit: HKObjectQueryNoLimit,
            sortDescriptors: nil
        ) { [weak self] _, samples, error in
            if let error {
                call.reject(error.localizedDescription)
                return
            }

            let stepCount = samples?
                .compactMap { $0 as? HKQuantitySample }
                .reduce(0) { partialResult, sample in
                    partialResult + sample.quantity.doubleValue(for: HKUnit.count())
                } ?? 0

            self?.resolve(call: call, stepCount: Int(stepCount))
        }

        healthStore.execute(query)
    }

    private func resolve(call: CAPPluginCall, stepCount: Int) {
        call.resolve([
            "stepCount": stepCount,
            "walkTimeSeconds": 0,
            "measuredAt": ISO8601DateFormatter().string(from: Date()),
            "source": "HEALTHKIT"
        ])
    }

    private func makeWalkPayload(
        sessionId: String,
        stepCount: Int,
        walkTimeSeconds: Int,
        distanceKm: Double,
        status: String
    ) -> [String: Any] {
        return [
            "sessionId": sessionId,
            "stepCount": stepCount,
            "walkTimeSeconds": walkTimeSeconds,
            "distanceKm": distanceKm,
            "measuredAt": ISO8601DateFormatter().string(from: Date()),
            "source": "CORE_MOTION_\(sessionId)",
            "status": status
        ]
    }
}
