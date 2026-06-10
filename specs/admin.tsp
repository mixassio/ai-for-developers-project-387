import "@typespec/http";
import "./models.tsp";

using TypeSpec.Http;

namespace CalendarOfCalls;

@doc("""
  Админская часть для владельца календаря. Авторизации нет: все операции
  выполняются от лица единственного предзаданного профиля владельца.
  """)
@tag("Admin")
@route("/admin")
interface AdminApi {
  @doc("Получить профиль владельца календаря.")
  @route("/profile")
  @get
  getProfile(): Owner;

  @doc("Создать новый тип события.")
  @route("/event-types")
  @post
  createEventType(@body body: EventTypeCreate): {
    @statusCode statusCode: 201;
    @body body: EventType;
  } | ValidationError;

  @doc("Получить список всех типов событий.")
  @route("/event-types")
  @get
  listEventTypes(): Page<EventType>;

  @doc("Получить один тип события по идентификатору.")
  @route("/event-types/{id}")
  @get
  getEventType(@path id: string): EventType | NotFoundError;

  @doc("Обновить тип события.")
  @route("/event-types/{id}")
  @put
  updateEventType(@path id: string, @body body: EventTypeUpdate):
    | EventType
    | NotFoundError
    | ValidationError;

  @doc("Удалить тип события.")
  @route("/event-types/{id}")
  @delete
  deleteEventType(@path id: string): {
    @statusCode statusCode: 204;
  } | NotFoundError;

  @doc("""
    Страница предстоящих встреч. Возвращает бронирования всех типов событий
    в едином списке, отсортированном по времени начала. Необязательные
    параметры `from`/`to` ограничивают период выборки.
    """)
  @route("/bookings")
  @get
  listBookings(
    @doc("Нижняя граница периода (UTC, ISO 8601), включительно.")
    @query
    from?: utcDateTime,

    @doc("Верхняя граница периода (UTC, ISO 8601), исключительно.")
    @query
    to?: utcDateTime,
  ): Page<Booking>;
}
