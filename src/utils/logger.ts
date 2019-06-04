import winston from "winston";

const logger = winston.createLogger({
	level: "info",
	format: winston.format.json(),
	defaultMeta: { service: "user-service" },
	transports: [
		new winston.transports.File({
			filename: "error.log",
			level: "error",
			maxsize: 5000
		})
	]
});

if (process.env.NODE_ENV !== "production") {
	logger.add(new winston.transports.Console({
		format: winston.format.prettyPrint()
	}));
}

export {logger};