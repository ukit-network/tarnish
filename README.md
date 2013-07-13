Tarnish - A Tainted Varnish Server
============================

A Varnish and Mustache rendering engine mashup in NodeJS.

The idea is to use NodeJS (being very fast, and asynchronus!) to build a 'Varnish style' server, that allows configuration in Javascript, can asynchronously get ESI's from defined backends (a big plus!), and will extent the ESI spec to include additional functionality - turning the ESI spec into a true 'Rendering Engine'

Ideas include:

Adding headers to ESI packets to allow additional functionality, 

e.g. 

X-USE-COOKIE-{name}, to pass a specific cookie from the ESI to the user.
X-USE-DATASOURCE-{name}, to allow tarnish to get data from a predefined backend, as JSON, into a value of tarnish.{JSON data}, so it can be rendered at delivery time using <<%tarnish.{var_name}%>>.  The idea is to use the Mustache standard for this data injection.


Utilising REDIS as a cache for pages,

e.g.

Store the WHOLE page as a REDIS object, using the hash key as the key value.
The ability to share these objects with multiple tarnish servers to ensure minimum workload.
The ability to store a central config for multiple servers, as well as configs on a 'per-server' basis.
The ability (in the future) to create a tarnish management tool, that can update multiple tarnish servers.
The ability to receive PURGE & BAN requests on 1 server, and have ALL tarnish servers updated.
The option of storing/caching DATASOURCE request into a single object to avoid data request overhead, and to prevent inconsistencies with changing data.  i.e. the process for getting data could be asynchronous from the delivery of the data

All objects could have an 'in memory', and 'in storage' lifetime, and the option to go an renew the object, and any related data at a predefined interval PRIOR to expiry.

Functionality like GEO detection, and DEVICE detection, should be in-built, and optional.

If a requirement, additionally session data could also be handled by the tarnish service (this certainly makes sense for anything with GEO or DEVICE detection), passing either the whole session object to the back-end, or just the key and allowing the backends to interact with the tarnish Redis servers for their own session needs.

This could also be used to take load off, and increase the security of, the backend services, by making pages USER/GROUP aware at the point of delivery.


..... LOTS MORE TO THINK ABOUT.....
