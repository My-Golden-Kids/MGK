import Capacitor
import UIKit

class CustomBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(MGKHealthPlugin())
    }
}
