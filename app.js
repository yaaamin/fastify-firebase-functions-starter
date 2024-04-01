import functions from "firebase-functions";
import Fastify from "fastify";
import swagger from "@fastify/swagger";
import swaggerui from "@fastify/swagger-ui";

async function registerRoutes(fastify) {
  fastify.addContentTypeParser("application/json", {}, (req, payload, done) => {
    req.rawBody = payload.rawBody;
    done(null, payload.body);
  });

  fastify.get("/", async (request, reply) => {
    return { hello: "world", env: process.env.NODE_ENV ?? "no" };
  });

  fastify.get("/home", async (req, reply) => {
    reply.send({ message: "Welcome to the home page" });
  });

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: "HDC CMS",
        description: "HDC CMS Development API",
        version: "0.1",
      },
      externalDocs: {
        url: "https://swagger.io",
        description: "Find more info here",
      },
      servers: [
        {
          url: "http://127.0.0.1:5001/firebase-fastify/asia-south1/app",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
      tags: [
        {
          name: "Roles",
        },
        {
          name: "Users",
        },
      ],
    },
  });

  await fastify.register(swaggerui, {
    routePrefix: "/docs",
    initOAuth: {},
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
    uiHooks: {
      onRequest: function (req, reply, next) {
        next();
      },
      preHandler: function (req, reply, next) {
        next();
      },
    },
    staticCSP: true,
    transformStaticCSP: (header) => {
      return header;
    },
    exposeRoute: true,
  });
}

const fastify = new Fastify({
  logger: true,
});

const fastifyApp = async (request, reply) => {
  await registerRoutes(fastify);
  await fastify.ready();
  fastify.server.emit("request", request, reply);
};

registerRoutes(fastify);

export const app = functions
  .region("asia-south1")
  .https.onRequest((request, response) => {
    fastify.ready().then(() => {
      fastify.server.emit("request", request, response);
    });
  });
