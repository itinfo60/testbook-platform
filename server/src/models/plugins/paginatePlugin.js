const paginatePlugin = (schema) => {
  schema.statics.paginate = async function (filter = {}, options = {}) {
    const {
      page = 1,
      limit = 12,
      sort = '-createdAt',
      populate = '',
      select = '',
      lean = true,
    } = options;

    const skip = (page - 1) * limit;

    const [total, docs] = await Promise.all([
      this.countDocuments(filter),
      this.find(filter)
        .populate(populate)
        .select(select)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(lean),
    ]);

    return {
      docs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  };
};

export default paginatePlugin;
