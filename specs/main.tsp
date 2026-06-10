import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi";
import "./models.tsp";
import "./admin.tsp";
import "./public.tsp";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

@service(#{ title: "Calendar of Calls API" })
@info(#{ version: "1.0.0" })
@doc("""
  API «Календарь звонков» — упрощённый сервис бронирования времени.

  Роли:
  - Владелец календаря — единственный заранее заданный профиль. Регистрации и
    авторизации нет; админские операции выполняются от его лица.
  - Гость — бронирует слоты без создания аккаунта и без входа в систему.

  Правило занятости: на одно и то же время нельзя создать две записи, даже если
  это разные типы событий.

  Окно записи: свободные слоты формируются на 14 дней, начиная с текущей даты.
  """)
@server("http://localhost:8080", "Локальный сервер разработки")
namespace CalendarOfCalls;
