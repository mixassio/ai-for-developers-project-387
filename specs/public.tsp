import "@typespec/http";
import "./models.tsp";

using TypeSpec.Http;

namespace CalendarOfCalls;

@doc("""
  Публичная часть для гостей. Гость не регистрируется и не входит в систему:
  он просматривает типы событий, выбирает свободный слот в ближайшие 14 дней
  и создаёт бронирование.
  """)
@tag("Public")
@route("/public")
interface PublicApi {
  @doc("Получить список доступных для записи типов событий (название, описание, длительность).")
  @route("/event-types")
  @get
  listPublicEventTypes(): Page<PublicEventType>;

  @doc("Получить один тип события в публичном представлении.")
  @route("/event-types/{id}")
  @get
  getPublicEventType(@path id: string): PublicEventType | NotFoundError;

  @doc("""
    Получить свободные слоты для типа события. Слоты формируются на 14 дней,
    начиная с текущей даты. Возвращаются только свободные слоты с учётом
    глобального правила занятости (время, занятое любым бронированием,
    исключается). Параметры `from`/`to` ограничивают выборку и обрезаются
    по границам 14-дневного окна.
    """)
  @route("/event-types/{id}/slots")
  @get
  listSlots(
    @path id: string,

    @doc("Нижняя граница выборки (UTC, ISO 8601). Обрезается до текущего момента.")
    @query
    from?: utcDateTime,

    @doc("Верхняя граница выборки (UTC, ISO 8601). Обрезается до `now + 14 дней`.")
    @query
    to?: utcDateTime,
  ): Slot[] | NotFoundError;

  @doc("""
    Создать бронирование на выбранный слот.

    Ошибки:
    - 404 — указанный тип события не найден;
    - 409 — на выбранное время уже есть бронирование (глобальное правило занятости);
    - 422 — слот вне 14-дневного окна или не выровнен по длительности типа события.
    """)
  @route("/bookings")
  @post
  createBooking(@body body: BookingCreate): {
    @statusCode statusCode: 201;
    @body body: Booking;
  } | NotFoundError | ConflictError | ValidationError;

  @doc("Получить созданное бронирование (страница подтверждения).")
  @route("/bookings/{id}")
  @get
  getBooking(@path id: string): Booking | NotFoundError;
}
