import { Action, ActionPanel, List } from "@raycast/api";

interface StatusCode {
  code: number;
  title: string;
  description: string;
}

interface Category {
  name: string;
  codes: StatusCode[];
}

const STATUS_CODES: Category[] = [
  {
    name: "1xx Informational",
    codes: [
      {
        code: 100,
        title: "Continue",
        description: "Server has received the request headers; client should proceed to send the body",
      },
      {
        code: 101,
        title: "Switching Protocols",
        description: "Server is switching protocols as requested by the client",
      },
      {
        code: 102,
        title: "Processing",
        description: "Server has received and is processing the request, but no response is available yet",
      },
      {
        code: 103,
        title: "Early Hints",
        description: "Used to return some response headers before final HTTP message",
      },
    ],
  },
  {
    name: "2xx Success",
    codes: [
      { code: 200, title: "OK", description: "Standard response for successful HTTP requests" },
      { code: 201, title: "Created", description: "Request has been fulfilled and a new resource has been created" },
      {
        code: 202,
        title: "Accepted",
        description: "Request has been accepted for processing, but processing is not complete",
      },
      {
        code: 203,
        title: "Non-Authoritative Information",
        description: "Response is a modified version of the origin server's response",
      },
      { code: 204, title: "No Content", description: "Request succeeded but there is no content to send back" },
      {
        code: 205,
        title: "Reset Content",
        description: "Server fulfilled the request and wants the client to reset the document view",
      },
      {
        code: 206,
        title: "Partial Content",
        description: "Server is delivering only part of the resource due to a range header",
      },
      { code: 207, title: "Multi-Status", description: "Response provides status for multiple independent operations" },
      {
        code: 208,
        title: "Already Reported",
        description: "Members of a DAV binding have already been enumerated and are not included again",
      },
      {
        code: 226,
        title: "IM Used",
        description:
          "Server has fulfilled a GET request and the response is a representation of one or more instance-manipulations",
      },
    ],
  },
  {
    name: "3xx Redirection",
    codes: [
      {
        code: 300,
        title: "Multiple Choices",
        description: "Request has more than one possible response; user or agent should choose one",
      },
      { code: 301, title: "Moved Permanently", description: "Resource has been permanently moved to a new URL" },
      { code: 302, title: "Found", description: "Resource temporarily resides under a different URL" },
      { code: 303, title: "See Other", description: "Response can be found under a different URL using a GET request" },
      {
        code: 304,
        title: "Not Modified",
        description: "Resource has not been modified since the version specified by the request headers",
      },
      { code: 305, title: "Use Proxy", description: "Requested resource must be accessed through the specified proxy" },
      {
        code: 307,
        title: "Temporary Redirect",
        description:
          "Request should be repeated with another URL, but future requests should still use the original URL",
      },
      {
        code: 308,
        title: "Permanent Redirect",
        description: "Request and all future requests should be repeated using another URL",
      },
    ],
  },
  {
    name: "4xx Client Error",
    codes: [
      { code: 400, title: "Bad Request", description: "Server cannot process the request due to a client error" },
      {
        code: 401,
        title: "Unauthorized",
        description: "Authentication is required and has failed or has not been provided",
      },
      {
        code: 402,
        title: "Payment Required",
        description: "Reserved for future use; sometimes used for digital payment systems",
      },
      { code: 403, title: "Forbidden", description: "Server understood the request but refuses to authorize it" },
      { code: 404, title: "Not Found", description: "Requested resource could not be found on the server" },
      {
        code: 405,
        title: "Method Not Allowed",
        description: "Request method is not supported for the requested resource",
      },
      {
        code: 406,
        title: "Not Acceptable",
        description: "Requested resource can only generate content not acceptable per the Accept headers",
      },
      {
        code: 407,
        title: "Proxy Authentication Required",
        description: "Client must first authenticate itself with the proxy",
      },
      { code: 408, title: "Request Timeout", description: "Server timed out waiting for the request" },
      { code: 409, title: "Conflict", description: "Request conflicts with the current state of the server" },
      { code: 410, title: "Gone", description: "Resource is no longer available and will not be available again" },
      {
        code: 411,
        title: "Length Required",
        description: "Request did not specify the length of its content as required",
      },
      {
        code: 412,
        title: "Precondition Failed",
        description: "Server does not meet one of the preconditions specified in the request",
      },
      {
        code: 413,
        title: "Content Too Large",
        description: "Request entity is larger than the server is willing or able to process",
      },
      { code: 414, title: "URI Too Long", description: "URI provided was too long for the server to process" },
      {
        code: 415,
        title: "Unsupported Media Type",
        description: "Request entity has a media type which the server does not support",
      },
      {
        code: 416,
        title: "Range Not Satisfiable",
        description: "Client has asked for a portion of the file the server cannot supply",
      },
      {
        code: 417,
        title: "Expectation Failed",
        description: "Server cannot meet the requirements of the Expect request-header field",
      },
      {
        code: 418,
        title: "I'm a Teapot",
        description: "Server refuses to brew coffee because it is, permanently, a teapot",
      },
      {
        code: 421,
        title: "Misdirected Request",
        description: "Request was directed at a server that is not able to produce a response",
      },
      {
        code: 422,
        title: "Unprocessable Content",
        description: "Request was well-formed but could not be followed due to semantic errors",
      },
      { code: 423, title: "Locked", description: "Resource that is being accessed is locked" },
      {
        code: 424,
        title: "Failed Dependency",
        description: "Request failed because it depended on another request that failed",
      },
      { code: 425, title: "Too Early", description: "Server is unwilling to process a request that might be replayed" },
      { code: 426, title: "Upgrade Required", description: "Client should switch to a different protocol" },
      {
        code: 428,
        title: "Precondition Required",
        description: "Origin server requires the request to be conditional",
      },
      {
        code: 429,
        title: "Too Many Requests",
        description: "User has sent too many requests in a given amount of time",
      },
      {
        code: 431,
        title: "Request Header Fields Too Large",
        description: "Server is unwilling to process the request because its header fields are too large",
      },
      {
        code: 451,
        title: "Unavailable For Legal Reasons",
        description: "Resource is unavailable due to legal demands",
      },
    ],
  },
  {
    name: "5xx Server Error",
    codes: [
      {
        code: 500,
        title: "Internal Server Error",
        description: "Server encountered an unexpected condition that prevented it from fulfilling the request",
      },
      {
        code: 501,
        title: "Not Implemented",
        description: "Server does not support the functionality required to fulfill the request",
      },
      { code: 502, title: "Bad Gateway", description: "Server received an invalid response from the upstream server" },
      {
        code: 503,
        title: "Service Unavailable",
        description: "Server is not ready to handle the request, often due to maintenance or overload",
      },
      {
        code: 504,
        title: "Gateway Timeout",
        description: "Server did not receive a timely response from the upstream server",
      },
      {
        code: 505,
        title: "HTTP Version Not Supported",
        description: "Server does not support the HTTP protocol version used in the request",
      },
      {
        code: 506,
        title: "Variant Also Negotiates",
        description: "Server has an internal configuration error in transparent content negotiation",
      },
      {
        code: 507,
        title: "Insufficient Storage",
        description: "Server is unable to store the representation needed to complete the request",
      },
      {
        code: 508,
        title: "Loop Detected",
        description: "Server detected an infinite loop while processing the request",
      },
      {
        code: 510,
        title: "Not Extended",
        description: "Further extensions to the request are required for the server to fulfill it",
      },
      {
        code: 511,
        title: "Network Authentication Required",
        description: "Client needs to authenticate to gain network access",
      },
    ],
  },
];

export default function Command() {
  return (
    <List searchBarPlaceholder="Search HTTP status codes..." throttle>
      {STATUS_CODES.map((category) => (
        <List.Section key={category.name} title={category.name}>
          {category.codes.map((status) => (
            <List.Item
              key={status.code}
              title={`${status.code} ${status.title}`}
              subtitle={status.description}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard title="Copy Status Code" content={String(status.code)} />
                  <Action.CopyToClipboard title="Copy Title" content={status.title} />
                  <Action.CopyToClipboard title="Copy Description" content={status.description} />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}
