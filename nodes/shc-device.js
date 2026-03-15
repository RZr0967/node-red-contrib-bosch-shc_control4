'use strict';

module.exports = function (RED) {
	class SHCDeviceNode {
		constructor(config) {
			RED.nodes.createNode(this, config);

			if (config.poll === undefined) {
				config.poll = true;
			}

			this.deviceName = config.device.split('|')[0];
			this.deviceId = config.device.split('|')[1];
			this.deviceModel = config.device.split('|')[2];
			this.roomName = config.device.split('|')[4];
			this.serviceId = config.service;
			this.state = config.state;
			this.poll = config.poll;
			this.name = config.name;
			this.shcConfig = RED.nodes.getNode(config.shc);

			if (this.shcConfig) {
				this.shcConfig.checkConnection(this);
				this.shcConfig.registerListener(this);
			}

			this.on('input', (msg, send, done) => {
				if (!(this.shcConfig && this.shcConfig.connected)) {
					done();
					return;
				}

				if (this.isValid(msg.payload) && this.serviceId && this.getServiceBody(msg.payload)) {
					if (this.deviceId === 'all') {
						done();
						return;
					}

					this.shcConfig.shc.getBshcClient().putState(
						this.getPath(),
						this.getServiceBody(msg.payload),
					).subscribe(result => {
						if (result._parsedResponse && result._parsedResponse.message) {
							send({topic: this.deviceName, payload: result._parsedResponse.message});
						}
						done();
					}, err => {
						done(err);
					});

					return;
				}

				if (this.deviceId === 'all' && this
